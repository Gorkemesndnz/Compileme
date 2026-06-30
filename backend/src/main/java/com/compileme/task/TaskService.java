package com.compileme.task;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.education.EducationService;
import com.compileme.task.dto.*;
import com.compileme.task.mapper.TaskMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUserProvider;
    private final EducationService educationService;

    public List<TaskResponse> list(
            LocalDate date,
            LocalDate from,
            LocalDate to,
            TaskKind kind,
            PlanningBucket bucket,
            Long projectId,
            Long educationId
    ) {
        Long userId = currentUserProvider.getCurrentUserId();
        return taskRepository.findAll(
                        buildTaskSpecification(userId, date, from, to, kind, bucket, projectId, educationId)
                )
                .stream()
                .map(TaskMapper::toResponse)
                .toList();
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        validateTaskTargets(request.kind(), request.educationId());
        Task task = TaskMapper.toEntity(request, userId);
        
        // Find maximum order index for matching date/bucket to append task
        int maxOrder = taskRepository.findAll(
                        buildTaskSpecification(userId, task.getScheduledDate(), null, null, null, task.getPlanningBucket(), null, null)
                )
                .stream()
                .mapToInt(Task::getOrderIndex)
                .max()
                .orElse(-1);
        task.setOrderIndex(maxOrder + 1);

        Task savedTask = taskRepository.save(task);
        return TaskMapper.toResponse(savedTask);
    }

    @Transactional
    public TaskResponse update(Long id, TaskUpdateRequest request) {
        Task task = getTaskForCurrentUser(id);
        validateTaskUpdateTargets(task, request);
        TaskMapper.apply(task, request);
        Task savedTask = taskRepository.save(task);
        return TaskMapper.toResponse(savedTask);
    }

    @Transactional
    public TaskResponse complete(Long id) {
        Task task = getTaskForCurrentUser(id);
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.DONE);
            task.setCompletedAt(OffsetDateTime.now());
        } else {
            task.setStatus(TaskStatus.TODO);
            task.setCompletedAt(null);
        }
        Task savedTask = taskRepository.save(task);
        return TaskMapper.toResponse(savedTask);
    }

    @Transactional
    public TaskResponse move(Long id, MoveRequest request) {
        Task task = getTaskForCurrentUser(id);
        if (request.scheduledDate() != null) {
            task.setScheduledDate(request.scheduledDate());
        }
        if (request.planningBucket() != null) {
            task.setPlanningBucket(request.planningBucket());
        }
        Task savedTask = taskRepository.save(task);
        return TaskMapper.toResponse(savedTask);
    }

    @Transactional
    public void reorder(List<ReorderItem> items) {
        for (ReorderItem item : items) {
            Task task = getTaskForCurrentUser(item.id());
            task.setOrderIndex(item.orderIndex());
            taskRepository.save(task);
        }
    }

    @Transactional
    public void delete(Long id) {
        Task task = getTaskForCurrentUser(id);
        taskRepository.delete(task);
    }

    /**
     * Dashboard modülü için bugün tamamlanan görev sayısını döner.
     */
    public long countTodayDone(LocalDate date) {
        Long userId = currentUserProvider.getCurrentUserId();
        return taskRepository.countByUserIdAndScheduledDateAndStatus(userId, date, TaskStatus.DONE);
    }

    /**
     * Dashboard modülü için bugünkü toplam görev sayısını döner.
     */
    public long countTodayTotal(LocalDate date) {
        Long userId = currentUserProvider.getCurrentUserId();
        return taskRepository.countByUserIdAndScheduledDate(userId, date);
    }

    private Task getTaskForCurrentUser(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Görev bulunamadı: " + id));
        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!task.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Görev bulunamadı: " + id);
        }
        return task;
    }

    private Specification<Task> buildTaskSpecification(
            Long userId,
            LocalDate date,
            LocalDate from,
            LocalDate to,
            TaskKind kind,
            PlanningBucket bucket,
            Long projectId,
            Long educationId
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("userId"), userId));
            if (date != null) {
                predicates.add(cb.equal(root.<LocalDate>get("scheduledDate"), date));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("scheduledDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<LocalDate>get("scheduledDate"), to));
            }
            if (kind != null) {
                predicates.add(cb.equal(root.get("kind"), kind));
            }
            if (bucket != null) {
                predicates.add(cb.equal(root.get("planningBucket"), bucket));
            }
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (educationId != null) {
                predicates.add(cb.equal(root.get("educationId"), educationId));
            }
            if (query != null && !Long.class.equals(query.getResultType())) {
                query.orderBy(
                        cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get("scheduledDate")), 1).otherwise(0)),
                        cb.asc(root.get("scheduledDate")),
                        cb.asc(cb.<Integer>selectCase().when(cb.isNull(root.get("scheduledTime")), 1).otherwise(0)),
                        cb.asc(root.get("scheduledTime")),
                        cb.asc(root.get("orderIndex"))
                );
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void validateTaskTargets(TaskKind kind, Long educationId) {
        if (kind == TaskKind.EDUCATION && educationId == null) {
            throw new IllegalArgumentException("Egitim gorevleri educationId icermelidir.");
        }
        if (educationId != null) {
            educationService.ensureEducationBelongsToCurrentUser(educationId);
        }
    }

    private void validateTaskUpdateTargets(Task task, TaskUpdateRequest request) {
        TaskKind nextKind = request.kind() != null ? request.kind() : task.getKind();
        Long nextEducationId = request.educationId() != null ? request.educationId() : task.getEducationId();
        validateTaskTargets(nextKind, nextEducationId);
    }
}

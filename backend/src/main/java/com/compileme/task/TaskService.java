package com.compileme.task;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.task.dto.*;
import com.compileme.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;
    private final CurrentUserProvider currentUserProvider;

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
        return taskRepository.findTasks(userId, date, from, to, kind, bucket, projectId, educationId)
                .stream()
                .map(TaskMapper::toResponse)
                .toList();
    }

    @Transactional
    public TaskResponse create(TaskRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Task task = TaskMapper.toEntity(request, userId);
        
        // Find maximum order index for matching date/bucket to append task
        int maxOrder = taskRepository.findTasks(userId, task.getScheduledDate(), null, null, null, task.getPlanningBucket(), null, null)
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
}

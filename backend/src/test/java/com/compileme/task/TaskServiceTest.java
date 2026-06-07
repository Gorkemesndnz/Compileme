package com.compileme.task;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.task.dto.MoveRequest;
import com.compileme.task.dto.TaskRequest;
import com.compileme.task.dto.TaskResponse;
import com.compileme.task.dto.TaskUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private TaskService taskService;

    private Long userId = 1L;
    private Task task;

    @BeforeEach
    void setUp() {
        task = new Task();
        task.setId(100L);
        task.setUserId(userId);
        task.setTitle("Test Task");
        task.setStatus(TaskStatus.TODO);
        task.setKind(TaskKind.GENERAL);
        task.setPlanningBucket(PlanningBucket.DAY);
        task.setScheduledDate(LocalDate.now());
        task.setOrderIndex(0);
    }

    @Test
    void list_ShouldReturnTaskResponses() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(taskRepository.findTasks(eq(userId), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(task));

        List<TaskResponse> result = taskService.list(LocalDate.now(), null, null, null, null, null, null);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Task", result.get(0).title());
    }

    @Test
    void create_ShouldSaveAndReturnResponse() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(taskRepository.findTasks(eq(userId), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of()); // orderIndex calculation max is -1 + 1 = 0
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskRequest request = new TaskRequest("Test Task", "Notes", TaskKind.GENERAL, LocalDate.now(), null, null, PlanningBucket.DAY, null, null, null, null);
        TaskResponse response = taskService.create(request);

        assertNotNull(response);
        assertEquals("Test Task", response.title());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void update_ShouldModifyAndSave() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskUpdateRequest request = new TaskUpdateRequest("Updated Task", "Updated Notes", TaskKind.REFACTOR, LocalDate.now(), null, null, PlanningBucket.WEEK, null, null, null, null);
        TaskResponse response = taskService.update(100L, request);


        assertNotNull(response);
        verify(taskRepository, times(1)).save(task);
    }

    @Test
    void complete_ShouldToggleStatusAndCompletedAt() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        // TODO -> DONE
        TaskResponse response = taskService.complete(100L);
        assertEquals(TaskStatus.DONE, task.getStatus());
        assertNotNull(task.getCompletedAt());

        // DONE -> TODO
        response = taskService.complete(100L);
        assertEquals(TaskStatus.TODO, task.getStatus());
        assertNull(task.getCompletedAt());
    }

    @Test
    void move_ShouldUpdateScheduledDateAndBucket() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        LocalDate nextWeek = LocalDate.now().plusWeeks(1);
        MoveRequest request = new MoveRequest(nextWeek, PlanningBucket.WEEK);
        TaskResponse response = taskService.move(100L, request);

        assertEquals(nextWeek, task.getScheduledDate());
        assertEquals(PlanningBucket.WEEK, task.getPlanningBucket());
    }

    @Test
    void delete_ShouldRemoveTask() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        taskService.delete(100L);

        verify(taskRepository, times(1)).delete(task);
    }

    @Test
    void getTask_ShouldThrowNotFound_WhenTaskNotExists() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> taskService.delete(999L));
    }
}

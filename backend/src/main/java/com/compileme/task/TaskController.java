package com.compileme.task;

import com.compileme.task.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) TaskKind kind,
            @RequestParam(required = false) PlanningBucket bucket,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) Long educationId
    ) {
        List<TaskResponse> tasks = taskService.list(date, from, to, kind, bucket, projectId, educationId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        TaskResponse response = taskService.create(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @RequestBody TaskUpdateRequest request
    ) {
        TaskResponse response = taskService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<TaskResponse> completeTask(@PathVariable Long id) {
        TaskResponse response = taskService.complete(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<TaskResponse> moveTask(
            @PathVariable Long id,
            @RequestBody MoveRequest request
    ) {
        TaskResponse response = taskService.move(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorderTasks(@Valid @RequestBody List<ReorderItem> items) {
        taskService.reorder(items);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

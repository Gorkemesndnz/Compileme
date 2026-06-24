package com.compileme.task.mapper;

import com.compileme.task.*;
import com.compileme.task.dto.TaskRequest;
import com.compileme.task.dto.TaskResponse;
import com.compileme.task.dto.TaskUpdateRequest;

public class TaskMapper {

    public static TaskResponse toResponse(Task task) {
        if (task == null) return null;
        return new TaskResponse(
                task.getId(),
                task.getUserId(),
                task.getTitle(),
                task.getNotes(),
                task.getStatus(),
                task.getKind(),
                task.getScheduledDate(),
                task.getScheduledTime(),
                task.getDurationMinutes(),
                task.getPlanningBucket(),
                task.getTargetPeriod(),
                task.getProjectId(),
                task.getPhaseId(),
                task.getEducationId(),
                task.getOrderIndex(),
                task.getCompletedAt(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    public static Task toEntity(TaskRequest request, Long userId) {
        if (request == null) return null;
        Task task = new Task();
        task.setUserId(userId);
        task.setTitle(request.title());
        task.setNotes(request.notes());
        task.setStatus(TaskStatus.TODO);
        task.setKind(request.kind() != null ? request.kind() : TaskKind.GENERAL);
        task.setScheduledDate(request.scheduledDate());
        task.setScheduledTime(request.scheduledTime());
        task.setDurationMinutes(request.durationMinutes());
        task.setPlanningBucket(request.planningBucket() != null ? request.planningBucket() : PlanningBucket.DAY);
        task.setTargetPeriod(request.targetPeriod());
        task.setProjectId(request.projectId());
        task.setPhaseId(request.phaseId());
        task.setEducationId(request.educationId());
        task.setOrderIndex(0);
        return task;
    }

    public static void apply(Task task, TaskUpdateRequest request) {
        if (task == null || request == null) return;
        if (request.title() != null) task.setTitle(request.title());
        if (request.notes() != null) task.setNotes(request.notes());
        if (request.kind() != null) task.setKind(request.kind());
        if (request.scheduledDate() != null) task.setScheduledDate(request.scheduledDate());
        if (request.scheduledTime() != null) task.setScheduledTime(request.scheduledTime());
        if (request.durationMinutes() != null) task.setDurationMinutes(request.durationMinutes());
        if (request.planningBucket() != null) task.setPlanningBucket(request.planningBucket());
        if (request.targetPeriod() != null) task.setTargetPeriod(request.targetPeriod());
        
        if (request.projectId() != null) task.setProjectId(request.projectId());
        if (request.phaseId() != null) task.setPhaseId(request.phaseId());
        if (request.educationId() != null) task.setEducationId(request.educationId());
    }
}

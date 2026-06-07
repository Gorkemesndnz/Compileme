package com.compileme.task.dto;

import com.compileme.task.PlanningBucket;
import com.compileme.task.TaskKind;
import com.compileme.task.TaskStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public record TaskResponse(
        Long id,
        Long userId,
        String title,
        String notes,
        TaskStatus status,
        TaskKind kind,
        LocalDate scheduledDate,
        LocalTime scheduledTime,
        Integer durationMinutes,
        PlanningBucket planningBucket,
        String targetPeriod,
        Long projectId,
        Long phaseId,
        Long educationId,
        int orderIndex,
        OffsetDateTime completedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

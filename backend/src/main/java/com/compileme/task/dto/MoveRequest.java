package com.compileme.task.dto;

import com.compileme.task.PlanningBucket;

import java.time.LocalDate;

public record MoveRequest(
        LocalDate scheduledDate,
        PlanningBucket planningBucket
) {}

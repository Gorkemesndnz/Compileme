package com.compileme.task;

import com.compileme.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "task")
@Getter
@Setter
public class Task extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskKind kind = TaskKind.GENERAL;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "planning_bucket", nullable = false)
    private PlanningBucket planningBucket = PlanningBucket.DAY;

    @Column(name = "target_period", length = 20)
    private String targetPeriod;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "phase_id")
    private Long phaseId;

    @Column(name = "education_id")
    private Long educationId;

    @Column(name = "order_index", nullable = false)
    private int orderIndex = 0;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
}

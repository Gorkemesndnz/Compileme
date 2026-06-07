package com.compileme.task.dto;

import com.compileme.task.PlanningBucket;
import com.compileme.task.TaskKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record TaskRequest(
        @NotBlank(message = "Görev başlığı boş olamaz")
        @Size(max = 300, message = "Görev başlığı en fazla 300 karakter olabilir")
        String title,

        String notes,

        TaskKind kind,

        LocalDate scheduledDate,

        LocalTime scheduledTime,

        Integer durationMinutes,

        PlanningBucket planningBucket,

        @Size(max = 20, message = "Hedef periyot en fazla 20 karakter olabilir")
        String targetPeriod,

        Long projectId,

        Long phaseId,

        Long educationId
) {}

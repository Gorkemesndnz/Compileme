package com.compileme.idea.dto;

import com.compileme.task.PlanningBucket;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record IdeaTaskCreateRequest(
        Long entryId,

        @NotBlank(message = "Gorev basligi bos olamaz")
        @Size(max = 300, message = "Gorev basligi en fazla 300 karakter olabilir")
        String title,

        String notes,

        LocalDate scheduledDate,

        LocalTime scheduledTime,

        Integer durationMinutes,

        PlanningBucket planningBucket,

        @Size(max = 20, message = "Hedef periyot en fazla 20 karakter olabilir")
        String targetPeriod
) {}

package com.compileme.project.dto;

import com.compileme.project.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProjectPhaseRequest(
        @NotBlank(message = "Faz adı boş olamaz")
        @Size(max = 200, message = "Faz adı en fazla 200 karakter olabilir")
        String name,

        String description,

        ProjectStatus status,

        LocalDate startDate,

        LocalDate endDate,

        Integer orderIndex
) {}

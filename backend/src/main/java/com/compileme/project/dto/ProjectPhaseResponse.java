package com.compileme.project.dto;

import com.compileme.project.ProjectStatus;

import java.time.LocalDate;

public record ProjectPhaseResponse(
        Long id,
        Long projectId,
        String name,
        String description,
        ProjectStatus status,
        LocalDate startDate,
        LocalDate endDate,
        int orderIndex
) {}

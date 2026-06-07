package com.compileme.project.dto;

import com.compileme.project.ProjectStatus;

import java.time.OffsetDateTime;

public record ProjectResponse(
        Long id,
        Long userId,
        String name,
        String description,
        ProjectStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

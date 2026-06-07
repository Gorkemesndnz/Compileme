package com.compileme.project.dto;

import com.compileme.project.TechnologyCategory;

public record ProjectTechnologyResponse(
        Long id,
        Long projectId,
        TechnologyCategory category,
        String title,
        String technology,
        String notes,
        int orderIndex
) {}

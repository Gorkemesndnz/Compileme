package com.compileme.education.dto;

import com.compileme.education.ResourceType;

public record EducationResourceResponse(
        Long id,
        Long educationId,
        String name,
        ResourceType type,
        String urlOrPath,
        Integer orderIndex
) {}

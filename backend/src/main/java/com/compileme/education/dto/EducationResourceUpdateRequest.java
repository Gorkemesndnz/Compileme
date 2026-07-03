package com.compileme.education.dto;

import com.compileme.education.ResourceType;

public record EducationResourceUpdateRequest(
        String name,
        ResourceType type,
        String urlOrPath,
        Integer orderIndex,
        Boolean completed
) {}

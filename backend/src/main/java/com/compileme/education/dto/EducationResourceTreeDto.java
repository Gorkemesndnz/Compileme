package com.compileme.education.dto;

import com.compileme.education.ResourceType;

public record EducationResourceTreeDto(
        Long id,
        String name,
        ResourceType type,
        String urlOrPath,
        Boolean completed,
        Integer orderIndex
) {}

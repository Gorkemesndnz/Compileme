package com.compileme.education.dto;

public record EducationPracticeTreeDto(
        Long id,
        Long resourceId,
        String title,
        Boolean completed,
        Integer orderIndex
) {}

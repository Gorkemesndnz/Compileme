package com.compileme.education.dto;

public record EducationPracticeResponse(
        Long id,
        Long educationId,
        Long resourceId,
        String title,
        Boolean completed,
        String code,
        String notes,
        Integer orderIndex
) {}

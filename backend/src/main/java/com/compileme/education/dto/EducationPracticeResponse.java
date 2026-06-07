package com.compileme.education.dto;

public record EducationPracticeResponse(
        Long id,
        Long educationId,
        String title,
        Boolean completed,
        String code,
        String notes,
        Integer orderIndex
) {}

package com.compileme.education.dto;

import com.compileme.education.EducationStatus;
import com.compileme.education.EducationType;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EducationResponse(
        Long id,
        Long userId,
        String title,
        String source,
        String sourceUrl,
        EducationType type,
        Integer progressPercent,
        EducationStatus status,
        LocalDate nextStudyDate,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

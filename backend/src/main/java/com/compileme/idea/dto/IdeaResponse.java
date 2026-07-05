package com.compileme.idea.dto;

import com.compileme.idea.IdeaStatus;

import java.time.OffsetDateTime;

public record IdeaResponse(
        Long id,
        Long userId,
        String title,
        String content,
        IdeaStatus status,
        String tags,
        Long convertedProjectId,
        long entryCount,
        long researchCount,
        long taskCount,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

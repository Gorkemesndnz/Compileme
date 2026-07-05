package com.compileme.idea.dto;

import com.compileme.idea.IdeaResearchType;

import java.time.OffsetDateTime;

public record IdeaResearchResponse(
        Long id,
        Long ideaId,
        String title,
        String url,
        IdeaResearchType type,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

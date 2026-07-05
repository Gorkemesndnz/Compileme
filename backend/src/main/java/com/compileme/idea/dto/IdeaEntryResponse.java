package com.compileme.idea.dto;

import java.time.OffsetDateTime;

public record IdeaEntryResponse(
        Long id,
        Long ideaId,
        String content,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}

package com.compileme.idea.event;

import com.compileme.idea.IdeaResearchType;

import java.time.OffsetDateTime;

public record IdeaResearchSnapshot(
        Long id,
        String title,
        String url,
        IdeaResearchType type,
        String notes,
        OffsetDateTime createdAt
) {}

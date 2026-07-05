package com.compileme.idea.event;

import java.time.OffsetDateTime;

public record IdeaEntrySnapshot(
        Long id,
        String content,
        OffsetDateTime createdAt
) {}

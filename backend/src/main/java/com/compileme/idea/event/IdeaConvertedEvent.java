package com.compileme.idea.event;

import com.compileme.common.event.DomainEvent;

import java.time.OffsetDateTime;

public record IdeaConvertedEvent(
        Long ideaId,
        Long userId,
        String title,
        String content,
        OffsetDateTime occurredAt
) implements DomainEvent {

    public IdeaConvertedEvent(Long ideaId, Long userId, String title, String content) {
        this(ideaId, userId, title, content, OffsetDateTime.now());
    }

    @Override
    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}

package com.compileme.project.event;

import com.compileme.common.event.DomainEvent;

import java.time.OffsetDateTime;

public record ProjectCreatedFromIdeaEvent(
        Long ideaId,
        Long projectId,
        OffsetDateTime occurredAt
) implements DomainEvent {

    public ProjectCreatedFromIdeaEvent(Long ideaId, Long projectId) {
        this(ideaId, projectId, OffsetDateTime.now());
    }

    @Override
    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}

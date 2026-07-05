package com.compileme.idea.event;

import com.compileme.common.event.DomainEvent;

import java.time.OffsetDateTime;
import java.util.List;

public record IdeaConvertedEvent(
        Long ideaId,
        Long userId,
        String title,
        String content,
        List<IdeaEntrySnapshot> entries,
        List<IdeaResearchSnapshot> research,
        OffsetDateTime occurredAt
) implements DomainEvent {

    public IdeaConvertedEvent(Long ideaId, Long userId, String title, String content) {
        this(ideaId, userId, title, content, List.of(), List.of(), OffsetDateTime.now());
    }

    public IdeaConvertedEvent(
            Long ideaId,
            Long userId,
            String title,
            String content,
            List<IdeaEntrySnapshot> entries,
            List<IdeaResearchSnapshot> research
    ) {
        this(ideaId, userId, title, content, entries, research, OffsetDateTime.now());
    }

    @Override
    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }
}

package com.compileme.idea.dto;

import com.compileme.task.dto.TaskResponse;

import java.time.OffsetDateTime;

public record IdeaTaskLinkResponse(
        Long id,
        Long ideaId,
        Long entryId,
        TaskResponse task,
        OffsetDateTime createdAt
) {}

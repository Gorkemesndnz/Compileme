package com.compileme.project.dto;

import com.compileme.project.SnippetCategory;

import java.time.OffsetDateTime;

public record ProjectSnippetResponse(
        Long id,
        Long projectId,
        String title,
        String language,
        String code,
        String description,
        SnippetCategory category,
        OffsetDateTime createdAt
) {}

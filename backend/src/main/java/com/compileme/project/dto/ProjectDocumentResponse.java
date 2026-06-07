package com.compileme.project.dto;

import com.compileme.project.DocumentFormat;
import com.compileme.project.DocumentType;

public record ProjectDocumentResponse(
        Long id,
        Long projectId,
        DocumentType type,
        String title,
        String content,
        DocumentFormat contentFormat,
        int orderIndex
) {}

package com.compileme.file.dto;

import java.time.OffsetDateTime;

public record StoredFileResponse(
        Long id,
        String originalName,
        Long fileSize,
        String contentType,
        OffsetDateTime createdAt,
        String downloadUrl
) {}

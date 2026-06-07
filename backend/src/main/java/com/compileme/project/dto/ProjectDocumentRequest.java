package com.compileme.project.dto;

import com.compileme.project.DocumentFormat;
import com.compileme.project.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectDocumentRequest(
        @NotNull(message = "Belge türü boş olamaz")
        DocumentType type,

        @NotBlank(message = "Belge başlığı boş olamaz")
        @Size(max = 200, message = "Belge başlığı en fazla 200 karakter olabilir")
        String title,

        String content,

        @NotNull(message = "Belge formatı boş olamaz")
        DocumentFormat contentFormat,

        Integer orderIndex
) {}

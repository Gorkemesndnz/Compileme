package com.compileme.project.dto;

import com.compileme.project.SnippetCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectSnippetRequest(
        @NotBlank(message = "Snippet başlığı boş olamaz")
        @Size(max = 200, message = "Snippet başlığı en fazla 200 karakter olabilir")
        String title,

        @Size(max = 40, message = "Kodlama dili en fazla 40 karakter olabilir")
        String language,

        @NotBlank(message = "Kod içeriği boş olamaz")
        String code,

        String description,

        @NotNull(message = "Kategori boş olamaz")
        SnippetCategory category
) {}

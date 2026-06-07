package com.compileme.project.dto;

import com.compileme.project.LinkCategory;
import com.compileme.project.LinkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectLinkRequest(
        @NotBlank(message = "Link başlığı boş olamaz")
        @Size(max = 200, message = "Link başlığı en fazla 200 karakter olabilir")
        String title,

        @NotBlank(message = "URL boş olamaz")
        String url,

        @NotNull(message = "Link türü boş olamaz")
        LinkType type,

        LinkCategory category,

        String notes,

        Integer orderIndex
) {}

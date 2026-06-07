package com.compileme.idea.dto;

import com.compileme.idea.IdeaStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IdeaRequest(
        @NotBlank(message = "Fikir başlığı boş olamaz")
        @Size(max = 200, message = "Fikir başlığı en fazla 200 karakter olabilir")
        String title,

        String content,

        IdeaStatus status,

        @Size(max = 300, message = "Etiketler en fazla 300 karakter olabilir")
        String tags
) {}

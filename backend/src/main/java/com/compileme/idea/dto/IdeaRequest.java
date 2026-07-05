package com.compileme.idea.dto;

import com.compileme.idea.IdeaStatus;
import jakarta.validation.constraints.Size;

public record IdeaRequest(
        @Size(max = 200, message = "Fikir basligi en fazla 200 karakter olabilir")
        String title,

        String content,

        IdeaStatus status,

        @Size(max = 300, message = "Etiketler en fazla 300 karakter olabilir")
        String tags
) {}

package com.compileme.idea.dto;

import com.compileme.idea.IdeaResearchType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IdeaResearchRequest(
        @NotBlank(message = "Arastirma basligi bos olamaz")
        @Size(max = 200, message = "Arastirma basligi en fazla 200 karakter olabilir")
        String title,

        String url,

        IdeaResearchType type,

        String notes
) {}

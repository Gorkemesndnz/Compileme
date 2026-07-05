package com.compileme.idea.dto;

import jakarta.validation.constraints.NotBlank;

public record IdeaEntryRequest(
        @NotBlank(message = "Girdi icerigi bos olamaz")
        String content
) {}

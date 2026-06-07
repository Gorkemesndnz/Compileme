package com.compileme.education.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ProgressUpdateRequest(
        @NotNull(message = "İlerleme yüzdesi boş olamaz")
        @Min(value = 0, message = "İlerleme yüzdesi en az 0 olabilir")
        @Max(value = 100, message = "İlerleme yüzdesi en fazla 100 olabilir")
        Integer progressPercent
) {}

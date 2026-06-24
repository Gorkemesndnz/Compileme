package com.compileme.education.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EducationPracticeRequest(
        @NotBlank(message = "Pratik başlığı boş olamaz")
        @Size(max = 200, message = "Pratik başlığı en fazla 200 karakter olabilir")
        String title,

        @NotNull(message = "Tamamlandı durumu belirtilmelidir")
        Boolean completed,

        String code,
        String notes,
        Long resourceId,
        Integer orderIndex
) {}

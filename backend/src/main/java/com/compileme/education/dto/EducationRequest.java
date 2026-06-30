package com.compileme.education.dto;

import com.compileme.education.EducationStatus;
import com.compileme.education.EducationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EducationRequest(
        @NotBlank(message = "Başlık boş olamaz")
        @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir")
        String title,

        @Size(max = 200, message = "Kaynak adı en fazla 200 karakter olabilir")
        String source,

        String sourceUrl,

        @NotNull(message = "Eğitim türü belirtilmelidir")
        EducationType type,

        EducationStatus status,

        LocalDate nextStudyDate,

        Integer durationHours,

        String description,

        String customCategory,

        LocalDate startDate,

        LocalDate endDate
) {}

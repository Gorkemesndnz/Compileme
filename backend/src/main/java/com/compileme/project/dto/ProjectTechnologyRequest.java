package com.compileme.project.dto;

import com.compileme.project.TechnologyCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectTechnologyRequest(
        @NotNull(message = "Teknoloji kategorisi boş olamaz")
        TechnologyCategory category,

        @NotBlank(message = "Teknoloji başlığı boş olamaz")
        @Size(max = 200, message = "Teknoloji başlığı en fazla 200 karakter olabilir")
        String title,

        @NotBlank(message = "Teknoloji adı boş olamaz")
        @Size(max = 200, message = "Teknoloji adı en fazla 200 karakter olabilir")
        String technology,

        String notes,

        Integer orderIndex
) {}

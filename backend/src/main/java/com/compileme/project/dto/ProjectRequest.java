package com.compileme.project.dto;

import com.compileme.project.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank(message = "Proje adı boş olamaz")
        @Size(max = 200, message = "Proje adı en fazla 200 karakter olabilir")
        String name,

        String description,

        ProjectStatus status
) {}

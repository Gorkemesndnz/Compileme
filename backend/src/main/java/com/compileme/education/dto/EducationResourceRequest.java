package com.compileme.education.dto;

import com.compileme.education.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EducationResourceRequest(
        @NotBlank(message = "Kaynak adı boş olamaz")
        @Size(max = 200, message = "Kaynak adı en fazla 200 karakter olabilir")
        String name,

        @NotNull(message = "Kaynak türü belirtilmelidir")
        ResourceType type,

        @NotBlank(message = "URL veya dosya yolu boş olamaz")
        String urlOrPath,

        Integer orderIndex,

        Boolean completed
) {}

package com.compileme.education.dto;

import jakarta.validation.constraints.NotNull;

public record EducationResourceReorderItem(
        @NotNull(message = "Kaynak ID boÅŸ olamaz")
        Long id,

        @NotNull(message = "SÄ±ralama indeksi boÅŸ olamaz")
        Integer orderIndex
) {}

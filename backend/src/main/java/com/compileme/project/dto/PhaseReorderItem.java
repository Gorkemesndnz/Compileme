package com.compileme.project.dto;

import jakarta.validation.constraints.NotNull;

public record PhaseReorderItem(
        @NotNull(message = "Faz ID boş olamaz")
        Long id,

        @NotNull(message = "Sıralama indeksi boş olamaz")
        Integer orderIndex
) {}

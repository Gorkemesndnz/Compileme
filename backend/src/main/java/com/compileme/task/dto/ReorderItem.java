package com.compileme.task.dto;

import jakarta.validation.constraints.NotNull;

public record ReorderItem(
        @NotNull(message = "Görev ID'si boş olamaz")
        Long id,

        @NotNull(message = "Sıralama indeksi boş olamaz")
        Integer orderIndex
) {}

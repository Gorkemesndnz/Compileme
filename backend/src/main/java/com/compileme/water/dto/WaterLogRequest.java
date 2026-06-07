package com.compileme.water.dto;

import com.compileme.water.WaterSource;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record WaterLogRequest(
        @NotNull(message = "Su kaynağı boş olamaz")
        WaterSource source,

        Integer amountMl,

        LocalDate logDate
) {}

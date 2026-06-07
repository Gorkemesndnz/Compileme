package com.compileme.water.dto;

import com.compileme.water.WaterSource;

import java.time.OffsetDateTime;

public record WaterLogResponse(
        Long id,
        int amountMl,
        WaterSource source,
        OffsetDateTime createdAt
) {}

package com.compileme.water.dto;

import java.util.List;

public record WaterSummaryResponse(
        int targetMl,
        int consumedMl,
        int percent,
        List<WaterLogResponse> logs
) {}

package com.compileme.water.mapper;

import com.compileme.water.WaterLog;
import com.compileme.water.WaterSource;
import com.compileme.water.dto.WaterLogResponse;
import com.compileme.water.dto.WaterSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public class WaterLogMapper {

    public static WaterLogResponse toResponse(WaterLog entity) {
        if (entity == null) {
            return null;
        }
        return new WaterLogResponse(
                entity.getId(),
                entity.getAmountMl(),
                entity.getSource(),
                entity.getCreatedAt()
        );
    }

    public static WaterLog toEntity(LocalDate logDate, WaterSource source, int amountMl, Long userId) {
        return WaterLog.builder()
                .userId(userId)
                .logDate(logDate)
                .source(source)
                .amountMl(amountMl)
                .build();
    }

    public static WaterSummaryResponse toSummaryResponse(int targetMl, int consumedMl, int percent, List<WaterLog> logs) {
        List<WaterLogResponse> logResponses = logs.stream()
                .map(WaterLogMapper::toResponse)
                .toList();
        return new WaterSummaryResponse(targetMl, consumedMl, percent, logResponses);
    }
}

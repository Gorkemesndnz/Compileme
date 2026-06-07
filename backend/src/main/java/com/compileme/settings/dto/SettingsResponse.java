package com.compileme.settings.dto;

public record SettingsResponse(
        Long id,
        Long userId,
        Integer waterGoalMl,
        String weatherCity,
        String theme,
        Integer focusBrightness,
        String focusTemperature
) {}

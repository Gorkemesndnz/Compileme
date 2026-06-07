package com.compileme.settings.mapper;

import com.compileme.settings.Settings;
import com.compileme.settings.dto.SettingsRequest;
import com.compileme.settings.dto.SettingsResponse;

public class SettingsMapper {

    public static SettingsResponse toResponse(Settings settings) {
        if (settings == null) {
            return null;
        }
        return new SettingsResponse(
                settings.getId(),
                settings.getUserId(),
                settings.getWaterGoalMl(),
                settings.getWeatherCity(),
                settings.getTheme(),
                settings.getFocusBrightness(),
                settings.getFocusTemperature()
        );
    }

    public static void apply(Settings settings, SettingsRequest request) {
        if (settings == null || request == null) {
            return;
        }
        settings.setWaterGoalMl(request.waterGoalMl());
        settings.setWeatherCity(request.weatherCity());
        settings.setTheme(request.theme());
        settings.setFocusBrightness(request.focusBrightness());
        settings.setFocusTemperature(request.focusTemperature());
    }
}

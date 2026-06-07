package com.compileme.settings;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.settings.dto.SettingsRequest;
import com.compileme.settings.dto.SettingsResponse;
import com.compileme.settings.mapper.SettingsMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettingsService {

    private final SettingsRepository settingsRepository;
    private final CurrentUserProvider currentUserProvider;

    public SettingsResponse getSettings() {
        Long userId = currentUserProvider.getCurrentUserId();
        Settings settings = getOrCreateSettingsForUser(userId);
        return SettingsMapper.toResponse(settings);
    }

    @Transactional
    public SettingsResponse updateSettings(SettingsRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Settings settings = getOrCreateSettingsForUser(userId);
        SettingsMapper.apply(settings, request);
        Settings saved = settingsRepository.save(settings);
        return SettingsMapper.toResponse(saved);
    }

    private Settings getOrCreateSettingsForUser(Long userId) {
        return settingsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Settings defaultSettings = Settings.builder()
                            .userId(userId)
                            .waterGoalMl(3000)
                            .weatherCity("İstanbul")
                            .theme("DARK")
                            .focusBrightness(77)
                            .focusTemperature("NEUTRAL")
                            .build();
                    return settingsRepository.save(defaultSettings);
                });
    }
}

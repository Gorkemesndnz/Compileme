package com.compileme.settings;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.settings.dto.SettingsRequest;
import com.compileme.settings.dto.SettingsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private SettingsRepository settingsRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private SettingsService settingsService;

    private Long userId = 1L;
    private Settings settings;

    @BeforeEach
    void setUp() {
        settings = Settings.builder()
                .id(1L)
                .userId(userId)
                .waterGoalMl(3000)
                .weatherCity("İstanbul")
                .theme("DARK")
                .focusBrightness(77)
                .focusTemperature("NEUTRAL")
                .build();
    }

    @Test
    void getSettings_ShouldReturnExistingSettings() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(settings));

        SettingsResponse result = settingsService.getSettings();

        assertNotNull(result);
        assertEquals(3000, result.waterGoalMl());
        assertEquals("İstanbul", result.weatherCity());
    }

    @Test
    void getSettings_ShouldCreateDefault_WhenNoneExists() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(settingsRepository.save(any(Settings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SettingsResponse result = settingsService.getSettings();

        assertNotNull(result);
        assertEquals(3000, result.waterGoalMl());
        assertEquals("İstanbul", result.weatherCity());
        verify(settingsRepository, times(1)).save(any(Settings.class));
    }

    @Test
    void updateSettings_ShouldModifyValues() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(Settings.class))).thenReturn(settings);

        SettingsRequest request = new SettingsRequest(3500, "İzmir", "LIGHT", 90, "WARM");
        SettingsResponse result = settingsService.updateSettings(request);

        assertNotNull(result);
        assertEquals(3500, result.waterGoalMl());
        assertEquals("İzmir", result.weatherCity());
        assertEquals("LIGHT", result.theme());
    }
}

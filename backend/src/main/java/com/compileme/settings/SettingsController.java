package com.compileme.settings;

import com.compileme.settings.dto.SettingsRequest;
import com.compileme.settings.dto.SettingsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<SettingsResponse> getSettings() {
        SettingsResponse response = settingsService.getSettings();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<SettingsResponse> updateSettings(@Valid @RequestBody SettingsRequest request) {
        SettingsResponse response = settingsService.updateSettings(request);
        return ResponseEntity.ok(response);
    }
}

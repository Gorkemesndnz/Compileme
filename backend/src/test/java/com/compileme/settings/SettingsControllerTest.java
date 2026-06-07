package com.compileme.settings;

import com.compileme.settings.dto.SettingsRequest;
import com.compileme.settings.dto.SettingsResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SettingsController.class)
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private SettingsService settingsService;

    @Test
    void getSettings_ShouldReturnSettingsJson() throws Exception {
        SettingsResponse response = new SettingsResponse(1L, 1L, 3000, "İstanbul", "DARK", 77, "NEUTRAL");
        when(settingsService.getSettings()).thenReturn(response);

        mockMvc.perform(get("/api/settings"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.weatherCity").value("İstanbul"));
    }

    @Test
    void updateSettings_ShouldReturnUpdatedSettings() throws Exception {
        SettingsResponse response = new SettingsResponse(1L, 1L, 3500, "İzmir", "LIGHT", 90, "WARM");
        when(settingsService.updateSettings(any(SettingsRequest.class))).thenReturn(response);

        SettingsRequest request = new SettingsRequest(3500, "İzmir", "LIGHT", 90, "WARM");

        mockMvc.perform(put("/api/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weatherCity").value("İzmir"))
                .andExpect(jsonPath("$.waterGoalMl").value(3500));
    }
}

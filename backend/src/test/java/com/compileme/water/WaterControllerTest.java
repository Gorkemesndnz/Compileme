package com.compileme.water;

import com.compileme.water.dto.WaterLogRequest;
import com.compileme.water.dto.WaterLogResponse;
import com.compileme.water.dto.WaterSummaryResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WaterController.class)
class WaterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private WaterService waterService;

    @Test
    void getSummary_ShouldReturnSummaryJson() throws Exception {
        WaterSummaryResponse response = new WaterSummaryResponse(3000, 1500, 50, List.of());
        when(waterService.getSummary(any())).thenReturn(response);

        mockMvc.perform(get("/api/water")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumedMl").value(1500))
                .andExpect(jsonPath("$.percent").value(50));
    }

    @Test
    void logWater_ShouldReturnCreatedStatus() throws Exception {
        WaterLogResponse response = new WaterLogResponse(1L, 500, WaterSource.HALF_500, OffsetDateTime.now());
        when(waterService.addLog(any(WaterLogRequest.class))).thenReturn(response);

        WaterLogRequest request = new WaterLogRequest(WaterSource.HALF_500, null, LocalDate.now());

        mockMvc.perform(post("/api/water")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.amountMl").value(500));
    }
}

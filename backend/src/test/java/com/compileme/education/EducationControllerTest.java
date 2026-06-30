package com.compileme.education;

import com.compileme.education.dto.EducationRequest;
import com.compileme.education.dto.EducationPracticeResponse;
import com.compileme.education.dto.EducationResponse;
import com.compileme.education.dto.ProgressUpdateRequest;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EducationController.class)
class EducationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EducationService educationService;

    @Test
    void getEducations_ShouldReturnJsonArray() throws Exception {
        EducationResponse response = new EducationResponse(
                10L, 1L, "Rust Language", "Rust Book", null, EducationType.PROGRAMMING,
                0, EducationStatus.ACTIVE, LocalDate.now(), null, null, null, null, null, OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(educationService.list()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/educations"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Rust Language"));
    }

    @Test
    void updateProgress_ShouldReturnOkStatus() throws Exception {
        EducationResponse response = new EducationResponse(
                10L, 1L, "Rust Language", "Rust Book", null, EducationType.PROGRAMMING,
                50, EducationStatus.ACTIVE, LocalDate.now(), null, null, null, null, null, OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(educationService.updateProgress(eq(10L), eq(50))).thenReturn(response);

        ProgressUpdateRequest request = new ProgressUpdateRequest(50);

        mockMvc.perform(patch("/api/educations/10/progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progressPercent").value(50));
    }

    @Test
    void updateProgress_ShouldReturnBadRequest_WhenPercentInvalid() throws Exception {
        ProgressUpdateRequest request = new ProgressUpdateRequest(150); // > 100 invalid

        mockMvc.perform(patch("/api/educations/10/progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPractices_ShouldIncludeResourceId() throws Exception {
        EducationPracticeResponse response = new EducationPracticeResponse(
                100L, 10L, 22L, "PDF exercise", false, "", "", 0
        );
        when(educationService.listPractices(10L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/educations/10/practices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].resourceId").value(22L));
    }
}

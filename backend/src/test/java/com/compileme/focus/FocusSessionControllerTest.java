package com.compileme.focus;

import com.compileme.focus.dto.FocusSessionResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FocusSessionController.class)
class FocusSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private FocusSessionService focusSessionService;

    @Test
    void startSession_ShouldReturnCreatedStatus() throws Exception {
        FocusSessionResponse response = new FocusSessionResponse(
                1L, 1L, OffsetDateTime.now(), null, null, FocusSessionType.FOCUS, LocalDate.now()
        );
        when(focusSessionService.startSession(any())).thenReturn(response);

        mockMvc.perform(post("/api/focus-sessions/start")
                        .param("type", "FOCUS"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("FOCUS"));
    }

    @Test
    void stopSession_ShouldReturnOkStatus() throws Exception {
        FocusSessionResponse response = new FocusSessionResponse(
                1L, 1L, OffsetDateTime.now().minusMinutes(1), OffsetDateTime.now(), 60, FocusSessionType.FOCUS, LocalDate.now()
        );
        when(focusSessionService.stopSession(1L)).thenReturn(response);

        mockMvc.perform(patch("/api/focus-sessions/1/stop"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationSeconds").value(60));
    }

    @Test
    void getSessions_ShouldReturnList() throws Exception {
        FocusSessionResponse response = new FocusSessionResponse(
                1L, 1L, OffsetDateTime.now().minusMinutes(1), OffsetDateTime.now(), 60, FocusSessionType.FOCUS, LocalDate.now()
        );
        when(focusSessionService.listSessions(any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/focus-sessions")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1));
    }
}

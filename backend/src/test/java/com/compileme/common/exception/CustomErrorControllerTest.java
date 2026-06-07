package com.compileme.common.exception;

import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomErrorController.class)
class CustomErrorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void handleErrorJson_ShouldReturnStructuredApiError() throws Exception {
        mockMvc.perform(get("/error")
                        .accept(MediaType.APPLICATION_JSON_VALUE)
                        .requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 404)
                        .requestAttr(RequestDispatcher.ERROR_MESSAGE, "Resource not found")
                        .requestAttr(RequestDispatcher.FORWARD_REQUEST_URI, "/api/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").value("Resource not found"))
                .andExpect(jsonPath("$.path").value("/api/nonexistent"));
    }

    @Test
    void handleErrorHtml_ShouldReturnElegantDarkThemePage() throws Exception {
        mockMvc.perform(get("/error")
                        .accept(MediaType.TEXT_HTML_VALUE)
                        .requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 503)
                        .requestAttr(RequestDispatcher.ERROR_MESSAGE, "Database is offline"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML_VALUE))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("503")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Database is offline")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Compileme")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Anasayfaya Dön")));
    }
}

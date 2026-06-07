package com.compileme.idea;

import com.compileme.idea.dto.IdeaRequest;
import com.compileme.idea.dto.IdeaResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IdeaController.class)
class IdeaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private IdeaService ideaService;

    @Test
    void getIdeas_ShouldReturnJsonArray() throws Exception {
        IdeaResponse response = new IdeaResponse(1L, 1L, "Test Idea", "Content", IdeaStatus.RAW, "tags", null, OffsetDateTime.now(), OffsetDateTime.now());
        when(ideaService.list()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/ideas"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Idea"));
    }

    @Test
    void createIdea_ShouldReturnCreatedStatus() throws Exception {
        IdeaResponse response = new IdeaResponse(1L, 1L, "New Idea", "Content", IdeaStatus.RAW, "tags", null, OffsetDateTime.now(), OffsetDateTime.now());
        when(ideaService.create(any(IdeaRequest.class))).thenReturn(response);

        IdeaRequest request = new IdeaRequest("New Idea", "Content", IdeaStatus.RAW, "tags");

        mockMvc.perform(post("/api/ideas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Idea"));
    }
}

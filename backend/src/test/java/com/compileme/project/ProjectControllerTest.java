package com.compileme.project;

import com.compileme.project.dto.ProjectRequest;
import com.compileme.project.dto.ProjectResponse;
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

@WebMvcTest(ProjectController.class)
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectService projectService;

    @Test
    void getProjects_ShouldReturnJsonArray() throws Exception {
        ProjectResponse response = new ProjectResponse(
                200L, 1L, "Compileme", "Productivity tool", ProjectStatus.PLANNING,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(projectService.list()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name").value("Compileme"));
    }

    @Test
    void createProject_ShouldReturnCreatedStatus() throws Exception {
        ProjectResponse response = new ProjectResponse(
                200L, 1L, "New Project", "Desc", ProjectStatus.PLANNING,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
        when(projectService.create(any(ProjectRequest.class))).thenReturn(response);

        ProjectRequest request = new ProjectRequest("New Project", "Desc", ProjectStatus.PLANNING);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("New Project"));
    }
}

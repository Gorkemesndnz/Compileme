package com.compileme.task;

import com.compileme.task.dto.TaskRequest;
import com.compileme.task.dto.TaskResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskService taskService;

    @Test
    void getTasks_ShouldReturnJsonArray() throws Exception {
        TaskResponse response = new TaskResponse(
                100L, 1L, "Test Task", "Notes", TaskStatus.TODO, TaskKind.GENERAL,
                LocalDate.now(), null, null, PlanningBucket.DAY, null, null, null, null,
                0, null, OffsetDateTime.now(), OffsetDateTime.now()
        );

        when(taskService.list(any(), any(), any(), any(), any(), any(), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/tasks")
                        .param("date", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].title").value("Test Task"));
    }

    @Test
    void createTask_ShouldReturnCreatedStatus() throws Exception {
        TaskResponse response = new TaskResponse(
                100L, 1L, "New Task", null, TaskStatus.TODO, TaskKind.GENERAL,
                LocalDate.now(), null, null, PlanningBucket.DAY, null, null, null, null,
                0, null, OffsetDateTime.now(), OffsetDateTime.now()
        );

        when(taskService.create(any(TaskRequest.class))).thenReturn(response);

        TaskRequest request = new TaskRequest("New Task", null, TaskKind.GENERAL, LocalDate.now(), null, null, PlanningBucket.DAY, null, null, null, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("New Task"));
    }

    @Test
    void createTask_ShouldReturnBadRequest_WhenTitleBlank() throws Exception {
        TaskRequest request = new TaskRequest("", null, TaskKind.GENERAL, LocalDate.now(), null, null, PlanningBucket.DAY, null, null, null, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}

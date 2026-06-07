package com.compileme.project;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.project.dto.ProjectRequest;
import com.compileme.project.dto.ProjectResponse;
import com.compileme.project.event.ProjectCreatedFromIdeaEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectPhaseRepository projectPhaseRepository;
    @Mock
    private ProjectTechnologyRepository projectTechnologyRepository;
    @Mock
    private ProjectSnippetRepository projectSnippetRepository;
    @Mock
    private ProjectLinkRepository projectLinkRepository;
    @Mock
    private ProjectDocumentRepository projectDocumentRepository;
    @Mock
    private CurrentUserProvider currentUserProvider;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ProjectService projectService;

    private Long userId = 1L;
    private Project project;

    @BeforeEach
    void setUp() {
        project = Project.builder()
                .userId(userId)
                .name("Compileme")
                .description("Productivity tool")
                .status(ProjectStatus.PLANNING)
                .build();
        project.setId(200L);
    }

    @Test
    void list_ShouldReturnProjectResponses() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(projectRepository.findAllByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(project));

        List<ProjectResponse> result = projectService.list();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Compileme", result.get(0).name());
    }

    @Test
    void create_ShouldSaveProject() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(projectRepository.save(any(Project.class))).thenReturn(project);

        ProjectRequest request = new ProjectRequest("Compileme", "Productivity tool", ProjectStatus.PLANNING);
        ProjectResponse response = projectService.create(request);

        assertNotNull(response);
        assertEquals("Compileme", response.name());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void createFromIdea_ShouldSaveProjectAndPublishEvent() {
        when(projectRepository.save(any(Project.class))).thenReturn(project);

        projectService.createFromIdea(10L, userId, "Compileme", "Productivity tool");

        verify(projectRepository, times(1)).save(any(Project.class));
        verify(eventPublisher, times(1)).publishEvent(any(ProjectCreatedFromIdeaEvent.class));
    }

    @Test
    void delete_ShouldRemoveProject() {
        when(projectRepository.findById(200L)).thenReturn(Optional.of(project));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        projectService.delete(200L);

        verify(projectRepository, times(1)).delete(project);
    }
}


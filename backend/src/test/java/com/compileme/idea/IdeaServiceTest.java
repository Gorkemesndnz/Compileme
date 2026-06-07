package com.compileme.idea;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.idea.dto.IdeaRequest;
import com.compileme.idea.dto.IdeaResponse;
import com.compileme.idea.event.IdeaConvertedEvent;
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
class IdeaServiceTest {

    @Mock
    private IdeaRepository ideaRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private IdeaService ideaService;

    private Long userId = 1L;
    private Idea idea;

    @BeforeEach
    void setUp() {
        idea = Idea.builder()
                .userId(userId)
                .title("Test Idea")
                .content("Content")
                .status(IdeaStatus.RAW)
                .tags("java,spring")
                .build();
        idea.setId(1L);
    }

    @Test
    void list_ShouldReturnIdeaResponses() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(ideaRepository.findAllByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(idea));

        List<IdeaResponse> result = ideaService.list();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Idea", result.get(0).title());
    }

    @Test
    void create_ShouldSaveIdea() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(ideaRepository.save(any(Idea.class))).thenReturn(idea);

        IdeaRequest request = new IdeaRequest("Test Idea", "Content", IdeaStatus.RAW, "java,spring");
        IdeaResponse response = ideaService.create(request);

        assertNotNull(response);
        assertEquals("Test Idea", response.title());
        verify(ideaRepository, times(1)).save(any(Idea.class));
    }

    @Test
    void convert_ShouldPublishEventAndChangeStatus() {
        when(ideaRepository.findById(1L)).thenReturn(Optional.of(idea));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(ideaRepository.save(any(Idea.class))).thenReturn(idea);

        IdeaResponse response = ideaService.convert(1L);

        assertNotNull(response);
        assertEquals(IdeaStatus.CONVERTED, idea.getStatus());
        verify(eventPublisher, times(1)).publishEvent(any(IdeaConvertedEvent.class));
        verify(ideaRepository, times(1)).save(idea);
    }

}

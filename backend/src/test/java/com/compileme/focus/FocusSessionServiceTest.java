package com.compileme.focus;

import com.compileme.common.security.CurrentUserProvider;
import com.compileme.focus.dto.FocusSessionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FocusSessionServiceTest {

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private FocusSessionService focusSessionService;

    private Long userId = 1L;
    private FocusSession focusSession;

    @BeforeEach
    void setUp() {
        focusSession = FocusSession.builder()
                .id(1L)
                .userId(userId)
                .startedAt(OffsetDateTime.now().minusMinutes(10))
                .type(FocusSessionType.FOCUS)
                .sessionDate(LocalDate.now())
                .build();
    }

    @Test
    void startSession_ShouldSaveNewSession() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(focusSessionRepository.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId))
                .thenReturn(Optional.empty());
        when(focusSessionRepository.save(any(FocusSession.class))).thenReturn(focusSession);

        FocusSessionResponse result = focusSessionService.startSession(FocusSessionType.FOCUS);

        assertNotNull(result);
        verify(focusSessionRepository, times(1)).save(any(FocusSession.class));
    }

    @Test
    void startSession_ShouldAutoStopPreviousActiveSession() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(focusSessionRepository.findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId))
                .thenReturn(Optional.of(focusSession));
        when(focusSessionRepository.save(any(FocusSession.class))).thenReturn(focusSession);

        focusSessionService.startSession(FocusSessionType.GENERAL);

        // Bir önceki aktif oturumun kapatıldığını doğrula
        assertNotNull(focusSession.getEndedAt());
        assertNotNull(focusSession.getDurationSeconds());
        verify(focusSessionRepository, times(2)).save(any(FocusSession.class));
    }

    @Test
    void stopSession_ShouldStopAndCalculateDuration() {
        when(focusSessionRepository.findById(1L)).thenReturn(Optional.of(focusSession));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(focusSessionRepository.save(any(FocusSession.class))).thenReturn(focusSession);

        FocusSessionResponse result = focusSessionService.stopSession(1L);

        assertNotNull(result);
        assertNotNull(focusSession.getEndedAt());
        assertTrue(focusSession.getDurationSeconds() >= 600); // 10 dakika = 600s
    }

    @Test
    void listSessions_ShouldReturnList() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(focusSessionRepository.findAllByUserIdAndSessionDateOrderByStartedAtDesc(userId, LocalDate.now()))
                .thenReturn(List.of(focusSession));

        List<FocusSessionResponse> result = focusSessionService.listSessions(LocalDate.now());

        assertNotNull(result);
        assertEquals(1, result.size());
    }
}

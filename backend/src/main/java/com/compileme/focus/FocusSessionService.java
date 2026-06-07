package com.compileme.focus;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.focus.dto.FocusSessionResponse;
import com.compileme.focus.mapper.FocusSessionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public FocusSessionResponse startSession(FocusSessionType type) {
        Long userId = currentUserProvider.getCurrentUserId();
        OffsetDateTime now = OffsetDateTime.now();

        // Eğer sonlandırılmamış aktif bir oturum varsa, onu otomatik sonlandır
        Optional<FocusSession> activeSessionOpt = focusSessionRepository
                .findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(userId);

        if (activeSessionOpt.isPresent()) {
            FocusSession activeSession = activeSessionOpt.get();
            activeSession.setEndedAt(now);
            long diffSeconds = Duration.between(activeSession.getStartedAt(), now).toSeconds();
            activeSession.setDurationSeconds((int) diffSeconds);
            focusSessionRepository.save(activeSession);
        }

        // Yeni oturum oluştur
        FocusSession newSession = FocusSession.builder()
                .userId(userId)
                .startedAt(now)
                .type(type != null ? type : FocusSessionType.FOCUS)
                .sessionDate(LocalDate.now())
                .build();

        FocusSession saved = focusSessionRepository.save(newSession);
        return FocusSessionMapper.toResponse(saved);
    }

    @Transactional
    public FocusSessionResponse stopSession(Long id) {
        FocusSession session = focusSessionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Odak oturumu bulunamadı: " + id));

        Long currentUserId = currentUserProvider.getCurrentUserId();
        if (!session.getUserId().equals(currentUserId)) {
            throw new NotFoundException("Odak oturumu bulunamadı: " + id);
        }

        if (session.getEndedAt() != null) {
            throw new IllegalStateException("Oturum zaten sonlandırılmış: " + id);
        }

        OffsetDateTime now = OffsetDateTime.now();
        session.setEndedAt(now);
        long diffSeconds = Duration.between(session.getStartedAt(), now).toSeconds();
        session.setDurationSeconds((int) diffSeconds);

        FocusSession saved = focusSessionRepository.save(session);
        return FocusSessionMapper.toResponse(saved);
    }

    public List<FocusSessionResponse> listSessions(LocalDate date) {
        Long userId = currentUserProvider.getCurrentUserId();
        LocalDate targetDate = (date != null) ? date : LocalDate.now();

        return focusSessionRepository.findAllByUserIdAndSessionDateOrderByStartedAtDesc(userId, targetDate)
                .stream()
                .map(FocusSessionMapper::toResponse)
                .toList();
    }
}

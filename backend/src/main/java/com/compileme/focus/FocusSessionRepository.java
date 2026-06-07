package com.compileme.focus;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FocusSessionRepository extends JpaRepository<FocusSession, Long> {
    List<FocusSession> findAllByUserIdAndSessionDateOrderByStartedAtDesc(Long userId, LocalDate date);
    Optional<FocusSession> findFirstByUserIdAndEndedAtIsNullOrderByStartedAtDesc(Long userId);
}

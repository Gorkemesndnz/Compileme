package com.compileme.focus.dto;

import com.compileme.focus.FocusSessionType;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record FocusSessionResponse(
        Long id,
        Long userId,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt,
        Integer durationSeconds,
        FocusSessionType type,
        LocalDate sessionDate
) {}

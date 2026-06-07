package com.compileme.focus.mapper;

import com.compileme.focus.FocusSession;
import com.compileme.focus.dto.FocusSessionResponse;

public class FocusSessionMapper {

    public static FocusSessionResponse toResponse(FocusSession session) {
        if (session == null) {
            return null;
        }
        return new FocusSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getDurationSeconds(),
                session.getType(),
                session.getSessionDate()
        );
    }
}

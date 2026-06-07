package com.compileme.focus;

import com.compileme.focus.dto.FocusSessionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/focus-sessions")
@RequiredArgsConstructor
public class FocusSessionController {

    private final FocusSessionService focusSessionService;

    @PostMapping("/start")
    public ResponseEntity<FocusSessionResponse> startSession(
            @RequestParam(value = "type", required = false) FocusSessionType type
    ) {
        FocusSessionResponse response = focusSessionService.startSession(type);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/stop")
    public ResponseEntity<FocusSessionResponse> stopSession(@PathVariable("id") Long id) {
        FocusSessionResponse response = focusSessionService.stopSession(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<FocusSessionResponse>> getSessions(
            @RequestParam(value = "date", required = false) LocalDate date
    ) {
        List<FocusSessionResponse> responses = focusSessionService.listSessions(date);
        return ResponseEntity.ok(responses);
    }
}

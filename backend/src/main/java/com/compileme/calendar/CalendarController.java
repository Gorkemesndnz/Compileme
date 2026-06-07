package com.compileme.calendar;

import com.compileme.calendar.dto.CalendarResponse;
import com.compileme.task.TaskKind;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping
    public ResponseEntity<CalendarResponse> getCalendar(
            @RequestParam(value = "view", defaultValue = "WEEK") CalendarView view,
            @RequestParam(value = "date", required = false) LocalDate date,
            @RequestParam(value = "kind", required = false) TaskKind kind
    ) {
        LocalDate referenceDate = (date != null) ? date : LocalDate.now();
        CalendarResponse response = calendarService.getCalendarData(view, referenceDate, kind);
        return ResponseEntity.ok(response);
    }
}

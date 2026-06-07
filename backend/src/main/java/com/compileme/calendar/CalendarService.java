package com.compileme.calendar;

import com.compileme.calendar.dto.CalendarResponse;
import com.compileme.education.EducationService;
import com.compileme.education.dto.EducationResponse;
import com.compileme.task.TaskKind;
import com.compileme.task.TaskService;
import com.compileme.task.dto.TaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CalendarService {

    private final TaskService taskService;
    private final EducationService educationService;

    public CalendarResponse getCalendarData(CalendarView view, LocalDate referenceDate, TaskKind kind) {
        LocalDate fromDate;
        LocalDate toDate;

        switch (view) {
            case DAY -> {
                fromDate = referenceDate;
                toDate = referenceDate;
            }
            case WEEK -> {
                fromDate = referenceDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                toDate = referenceDate.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            }
            case MONTH -> {
                fromDate = referenceDate.with(TemporalAdjusters.firstDayOfMonth());
                toDate = referenceDate.with(TemporalAdjusters.lastDayOfMonth());
            }
            default -> throw new IllegalArgumentException("Bilinmeyen takvim görünümü: " + view);
        }

        // 1. Görevleri çek (Task list)
        List<TaskResponse> tasks = taskService.list(
                null,       // specific date null (aralık sorguluyoruz)
                fromDate,   // from date
                toDate,     // to date
                kind,       // task kind filter
                null,       // planning bucket filter null
                null,       // project id null
                null        // education id null
        );

        // 2. Eğitimleri çek (Education list)
        // Eğer kind filtresi yoksa (null) veya kind filtresi EDUCATION ise eğitimleri dahil et.
        // Diğer kind filtrelerinde (örn. PROJECT, REFACTOR) eğitimleri listelemeyiz.
        List<EducationResponse> educations = List.of();
        if (kind == null || kind == TaskKind.EDUCATION) {
            educations = educationService.listByNextStudyDateRange(fromDate, toDate);
        }

        return new CalendarResponse(tasks, educations);
    }
}

package com.compileme.calendar;

import com.compileme.calendar.dto.CalendarResponse;
import com.compileme.education.EducationService;
import com.compileme.education.dto.EducationResponse;
import com.compileme.task.TaskKind;
import com.compileme.task.TaskService;
import com.compileme.task.dto.TaskResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CalendarServiceTest {

    @Mock
    private TaskService taskService;

    @Mock
    private EducationService educationService;

    @InjectMocks
    private CalendarService calendarService;

    @Test
    void getCalendarData_ShouldCalculateDatesAndFetchData() {
        LocalDate referenceDate = LocalDate.of(2026, 6, 7); // Pazar günü
        // Haftalık görünümde Pazartesi 06-01'den Pazar 06-07'ye kadar hesaplamalı

        when(taskService.list(isNull(), any(LocalDate.class), any(LocalDate.class), any(), any(), any(), any()))
                .thenReturn(List.of());
        when(educationService.listByNextStudyDateRange(any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        CalendarResponse result = calendarService.getCalendarData(CalendarView.WEEK, referenceDate, null);

        assertNotNull(result);
        // Doğru tarih sınırlarıyla çağrıldığını kontrol et
        verify(taskService, times(1)).list(
                isNull(),
                eq(LocalDate.of(2026, 6, 1)), // Pazartesi
                eq(LocalDate.of(2026, 6, 7)), // Pazar
                isNull(), isNull(), isNull(), isNull()
        );
        verify(educationService, times(1)).listByNextStudyDateRange(
                eq(LocalDate.of(2026, 6, 1)),
                eq(LocalDate.of(2026, 6, 7))
        );
    }

    @Test
    void getCalendarData_ShouldExcludeEducations_WhenKindFilterIsNotEducation() {
        LocalDate referenceDate = LocalDate.of(2026, 6, 7);

        when(taskService.list(isNull(), any(LocalDate.class), any(LocalDate.class), any(), any(), any(), any()))
                .thenReturn(List.of());

        CalendarResponse result = calendarService.getCalendarData(CalendarView.DAY, referenceDate, TaskKind.PROJECT);

        assertNotNull(result);
        assertTrue(result.educations().isEmpty());
        verifyNoInteractions(educationService); // EducationService çağrılmamış olmalı
    }
}

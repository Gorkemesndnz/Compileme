package com.compileme.dashboard;

import com.compileme.dashboard.dto.DashboardResponse;
import com.compileme.task.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TaskService taskService;

    public DashboardResponse getDashboardSummary(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        
        long todayDone = taskService.countTodayDone(targetDate);
        long todayTotal = taskService.countTodayTotal(targetDate);

        return new DashboardResponse(todayTotal, todayDone);
    }
}

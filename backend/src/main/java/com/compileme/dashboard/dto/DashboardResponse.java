package com.compileme.dashboard.dto;

public record DashboardResponse(
        long todayTotal,
        long todayDone,
        
        // Gelecek fazlarda (Faz 3-7) doldurulacak gösterge paneli alanları
        long activeProjectsCount,
        long activeEducationsCount,
        long rawIdeasCount,
        int todayWaterAmountMl
) {
    public DashboardResponse(long todayTotal, long todayDone) {
        this(todayTotal, todayDone, 0L, 0L, 0L, 0);
    }
}

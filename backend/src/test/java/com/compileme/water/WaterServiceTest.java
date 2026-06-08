package com.compileme.water;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.water.dto.WaterLogRequest;
import com.compileme.water.dto.WaterLogResponse;
import com.compileme.water.dto.WaterSummaryResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaterServiceTest {

    @Mock
    private WaterLogRepository waterLogRepository;

    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private WaterService waterService;

    private Long userId = 1L;
    private WaterLog waterLog;

    @BeforeEach
    void setUp() {
        waterLog = WaterLog.builder()
                .id(1L)
                .userId(userId)
                .amountMl(500)
                .source(WaterSource.HALF_500)
                .logDate(LocalDate.now())
                .build();
    }

    @Test
    void getSummary_ShouldCalculateSummaryCorrectly() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(waterLogRepository.sumAmount(userId, LocalDate.now())).thenReturn(1500);
        when(waterLogRepository.findAllByUserIdAndLogDateOrderByCreatedAtDesc(userId, LocalDate.now()))
                .thenReturn(List.of(waterLog));

        // Default goal: 3000ml (İleride settings entegre olunca settingsService mocklanacak)
        // 1500ml / 3000ml = %50
        WaterSummaryResponse summary = waterService.getSummary(LocalDate.now());

        assertNotNull(summary);
        assertEquals(1500, summary.consumedMl());
        assertEquals(50, summary.percent());
        assertEquals(1, summary.logs().size());
    }

    @Test
    void logWater_ShouldResolvePresetSource() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);
        when(waterLogRepository.save(any(WaterLog.class))).thenReturn(waterLog);

        WaterLogRequest request = new WaterLogRequest(WaterSource.HALF_500, null, LocalDate.now());
        WaterLogResponse response = waterService.addLog(request);

        assertNotNull(response);
        assertEquals(500, response.amountMl());
        verify(waterLogRepository, times(1)).save(any(WaterLog.class));
    }

    @Test
    void logWater_ShouldResolvePresetSourceWithCustomAmount() {
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        WaterLog customWaterLog = WaterLog.builder()
                .id(2L)
                .userId(userId)
                .amountMl(470)
                .source(WaterSource.HALF_500)
                .logDate(LocalDate.now())
                .build();
        when(waterLogRepository.save(any(WaterLog.class))).thenReturn(customWaterLog);

        WaterLogRequest request = new WaterLogRequest(WaterSource.HALF_500, 470, LocalDate.now());
        WaterLogResponse response = waterService.addLog(request);

        assertNotNull(response);
        assertEquals(470, response.amountMl());
        verify(waterLogRepository, times(1)).save(any(WaterLog.class));
    }

    @Test
    void logWater_ShouldThrowError_WhenCustomAmountInvalid() {
        WaterLogRequest request = new WaterLogRequest(WaterSource.CUSTOM, 0, LocalDate.now());
        assertThrows(IllegalArgumentException.class, () -> waterService.addLog(request));
    }

    @Test
    void deleteLog_ShouldDelete_WhenOwnershipMatches() {
        when(waterLogRepository.findById(1L)).thenReturn(Optional.of(waterLog));
        when(currentUserProvider.getCurrentUserId()).thenReturn(userId);

        waterService.deleteLog(1L);

        verify(waterLogRepository, times(1)).delete(waterLog);
    }
}

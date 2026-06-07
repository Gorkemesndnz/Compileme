package com.compileme.water;

import com.compileme.common.exception.NotFoundException;
import com.compileme.common.security.CurrentUserProvider;
import com.compileme.water.dto.WaterLogRequest;
import com.compileme.water.dto.WaterLogResponse;
import com.compileme.water.dto.WaterSummaryResponse;
import com.compileme.water.mapper.WaterLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WaterService {

    private final WaterLogRepository waterLogRepository;
    private final CurrentUserProvider currentUserProvider;

    // Faz 9'da settings'ten okunacak günlük su hedefi varsayılanı (3000 ml)
    private static final int DEFAULT_WATER_GOAL_ML = 3000;

    public WaterSummaryResponse getSummary(LocalDate date) {
        Long userId = currentUserProvider.getCurrentUserId();
        LocalDate targetDate = date != null ? date : LocalDate.now();

        List<WaterLog> logs = waterLogRepository.findAllByUserIdAndLogDateOrderByCreatedAtDesc(userId, targetDate);
        int consumedMl = waterLogRepository.sumAmount(userId, targetDate);
        int percent = (int) Math.round(consumedMl * 100.0 / DEFAULT_WATER_GOAL_ML);

        return WaterLogMapper.toSummaryResponse(DEFAULT_WATER_GOAL_ML, consumedMl, percent, logs);
    }

    @Transactional
    public WaterLogResponse addLog(WaterLogRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        LocalDate targetDate = request.logDate() != null ? request.logDate() : LocalDate.now();

        int amountMl;
        if (request.source() == WaterSource.CUSTOM) {
            if (request.amountMl() == null || request.amountMl() <= 0) {
                throw new IllegalArgumentException("Özel su miktarı 0'dan büyük olmalıdır");
            }
            amountMl = request.amountMl();
        } else {
            amountMl = request.source().getDefaultMl();
        }

        WaterLog waterLog = WaterLogMapper.toEntity(targetDate, request.source(), amountMl, userId);
        WaterLog savedLog = waterLogRepository.save(waterLog);
        return WaterLogMapper.toResponse(savedLog);
    }

    @Transactional
    public void deleteLog(Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        WaterLog waterLog = waterLogRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Su kaydı bulunamadı: " + id));

        if (!waterLog.getUserId().equals(userId)) {
            throw new NotFoundException("Su kaydı bulunamadı: " + id);
        }

        waterLogRepository.delete(waterLog);
    }

    public int getTodayConsumedAmount(LocalDate date) {
        Long userId = currentUserProvider.getCurrentUserId();
        LocalDate targetDate = date != null ? date : LocalDate.now();
        return waterLogRepository.sumAmount(userId, targetDate);
    }
}

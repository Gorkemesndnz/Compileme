package com.compileme.water;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface WaterLogRepository extends JpaRepository<WaterLog, Long> {

    List<WaterLog> findAllByUserIdAndLogDateOrderByCreatedAtDesc(Long userId, LocalDate logDate);

    @Query("select coalesce(sum(w.amountMl), 0) from WaterLog w where w.userId = :userId and w.logDate = :date")
    int sumAmount(@Param("userId") Long userId, @Param("date") LocalDate date);
}

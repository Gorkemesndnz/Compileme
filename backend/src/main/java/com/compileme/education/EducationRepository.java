package com.compileme.education;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Long> {
    List<Education> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<Education> findAllByUserIdAndNextStudyDateBetween(Long userId, LocalDate fromDate, LocalDate toDate);
}

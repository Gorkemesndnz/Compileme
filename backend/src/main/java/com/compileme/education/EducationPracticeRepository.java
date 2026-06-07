package com.compileme.education;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EducationPracticeRepository extends JpaRepository<EducationPractice, Long> {
    List<EducationPractice> findAllByEducationIdOrderByOrderIndexAsc(Long educationId);
}

package com.compileme.education;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.compileme.education.dto.EducationPracticeTreeDto;
import java.util.List;

public interface EducationPracticeRepository extends JpaRepository<EducationPractice, Long> {
    List<EducationPractice> findAllByEducationIdOrderByOrderIndexAsc(Long educationId);

    @Query("SELECT new com.compileme.education.dto.EducationPracticeTreeDto(p.id, p.resource.id, p.title, p.completed, p.orderIndex) " +
           "FROM EducationPractice p WHERE p.education.id = :educationId ORDER BY p.orderIndex ASC")
    List<EducationPracticeTreeDto> findTreeDtoByEducationId(@Param("educationId") Long educationId);
}

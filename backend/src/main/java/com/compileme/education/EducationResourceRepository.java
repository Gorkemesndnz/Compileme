package com.compileme.education;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.compileme.education.dto.EducationResourceTreeDto;
import java.util.List;

public interface EducationResourceRepository extends JpaRepository<EducationResource, Long> {
    List<EducationResource> findAllByEducationIdOrderByOrderIndexAsc(Long educationId);

    @Query("SELECT new com.compileme.education.dto.EducationResourceTreeDto(r.id, r.name, r.type, r.urlOrPath, r.completed, r.orderIndex) " +
           "FROM EducationResource r WHERE r.education.id = :educationId ORDER BY r.orderIndex ASC")
    List<EducationResourceTreeDto> findTreeDtoByEducationId(@Param("educationId") Long educationId);
}

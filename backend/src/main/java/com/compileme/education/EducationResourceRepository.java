package com.compileme.education;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EducationResourceRepository extends JpaRepository<EducationResource, Long> {
    List<EducationResource> findAllByEducationIdOrderByOrderIndexAsc(Long educationId);
}

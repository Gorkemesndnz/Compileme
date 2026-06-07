package com.compileme.project;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectPhaseRepository extends JpaRepository<ProjectPhase, Long> {
    List<ProjectPhase> findAllByProjectIdOrderByOrderIndexAsc(Long projectId);
}

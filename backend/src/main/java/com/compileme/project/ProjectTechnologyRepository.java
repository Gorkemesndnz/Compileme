package com.compileme.project;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectTechnologyRepository extends JpaRepository<ProjectTechnology, Long> {
    List<ProjectTechnology> findAllByProjectIdOrderByOrderIndexAsc(Long projectId);
}

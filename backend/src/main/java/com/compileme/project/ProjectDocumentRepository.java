package com.compileme.project;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, Long> {
    List<ProjectDocument> findAllByProjectIdOrderByOrderIndexAsc(Long projectId);
}

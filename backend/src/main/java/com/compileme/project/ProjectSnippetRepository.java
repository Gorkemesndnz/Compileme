package com.compileme.project;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectSnippetRepository extends JpaRepository<ProjectSnippet, Long> {
    List<ProjectSnippet> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
}

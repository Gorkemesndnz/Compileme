package com.compileme.idea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaResearchRepository extends JpaRepository<IdeaResearch, Long> {
    List<IdeaResearch> findAllByIdeaIdOrderByCreatedAtDesc(Long ideaId);
    long countByIdeaId(Long ideaId);
}

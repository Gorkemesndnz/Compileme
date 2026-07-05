package com.compileme.idea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaTaskLinkRepository extends JpaRepository<IdeaTaskLink, Long> {
    List<IdeaTaskLink> findAllByIdeaIdOrderByCreatedAtDesc(Long ideaId);
    long countByIdeaId(Long ideaId);
}

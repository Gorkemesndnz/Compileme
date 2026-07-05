package com.compileme.idea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaEntryRepository extends JpaRepository<IdeaEntry, Long> {
    List<IdeaEntry> findAllByIdeaIdOrderByCreatedAtDesc(Long ideaId);
    long countByIdeaId(Long ideaId);
}

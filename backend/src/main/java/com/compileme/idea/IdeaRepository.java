package com.compileme.idea;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    List<Idea> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}

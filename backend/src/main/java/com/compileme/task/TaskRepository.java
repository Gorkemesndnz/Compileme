package com.compileme.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    long countByUserIdAndScheduledDateAndStatus(Long userId, LocalDate date, TaskStatus status);
    long countByUserIdAndScheduledDate(Long userId, LocalDate date);
}

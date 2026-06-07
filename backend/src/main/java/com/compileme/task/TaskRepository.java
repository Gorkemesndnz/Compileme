package com.compileme.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE t.userId = :userId " +
           "AND (cast(:date as date) is null OR t.scheduledDate = :date) " +
           "AND (cast(:fromDate as date) is null OR t.scheduledDate >= :fromDate) " +
           "AND (cast(:toDate as date) is null OR t.scheduledDate <= :toDate) " +
           "AND (cast(:kind as string) is null OR t.kind = :kind) " +
           "AND (cast(:bucket as string) is null OR t.planningBucket = :bucket) " +
           "AND (cast(:projectId as long) is null OR t.projectId = :projectId) " +
           "AND (cast(:educationId as long) is null OR t.educationId = :educationId) " +
           "ORDER BY t.scheduledDate ASC, t.scheduledTime ASC, t.orderIndex ASC")
    List<Task> findTasks(
            @Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("kind") TaskKind kind,
            @Param("bucket") PlanningBucket bucket,
            @Param("projectId") Long projectId,
            @Param("educationId") Long educationId
    );

    long countByUserIdAndScheduledDateAndStatus(Long userId, LocalDate date, TaskStatus status);
    long countByUserIdAndScheduledDate(Long userId, LocalDate date);
}

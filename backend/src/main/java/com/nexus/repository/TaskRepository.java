package com.nexus.repository;

import com.nexus.entity.Task;
import com.nexus.enums.Priority;
import com.nexus.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    Page<Task> findByProjectId(Long projectId, Pageable pageable);
    List<Task> findByProjectIdOrderByPositionAsc(Long projectId);

    Page<Task> findByAssigneeId(Long assigneeId, Pageable pageable);
    Page<Task> findByStatus(TaskStatus status, Pageable pageable);
    Page<Task> findByPriority(Priority priority, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.status = :status ORDER BY t.position ASC")
    List<Task> findByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Task> searchTasks(@Param("search") String search, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Task> searchByProject(@Param("projectId") Long projectId, @Param("search") String search, Pageable pageable);

    long countByStatus(TaskStatus status);
    long countByProjectId(Long projectId);
    long countByProjectIdAndStatus(Long projectId, TaskStatus status);
    long countByAssigneeId(Long assigneeId);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.dueDate < :today AND t.status != 'COMPLETED'")
    List<Task> findOverdueTasks(@Param("userId") Long userId, @Param("today") LocalDate today);

    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :start AND :end AND t.status != 'COMPLETED'")
    List<Task> findTasksDueSoon(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.priority = :priority")
    List<Task> findByProjectIdAndPriority(@Param("projectId") Long projectId, @Param("priority") Priority priority);
}

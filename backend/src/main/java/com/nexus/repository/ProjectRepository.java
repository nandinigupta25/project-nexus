package com.nexus.repository;

import com.nexus.entity.Project;
import com.nexus.enums.Priority;
import com.nexus.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p WHERE p.isArchived = false AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchProjects(@Param("search") String search, Pageable pageable);

    Page<Project> findByStatus(ProjectStatus status, Pageable pageable);
    Page<Project> findByPriority(Priority priority, Pageable pageable);
    Page<Project> findByOwnerId(Long ownerId, Pageable pageable);
    Page<Project> findByTeamId(Long teamId, Pageable pageable);
    Page<Project> findByIsArchived(Boolean isArchived, Pageable pageable);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.id = :userId")
    Page<Project> findByMemberId(@Param("userId") Long userId, Pageable pageable);

    long countByStatus(ProjectStatus status);
    long countByIsArchived(Boolean isArchived);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.owner.id = :userId OR :userId IN (SELECT m.id FROM p.members m)")
    long countByUserInvolved(@Param("userId") Long userId);

    @Query("SELECT p FROM Project p WHERE p.status = :status AND p.isArchived = false")
    List<Project> findByStatusAndNotArchived(@Param("status") ProjectStatus status);
}

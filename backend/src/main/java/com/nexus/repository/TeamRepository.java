package com.nexus.repository;

import com.nexus.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Page<Team> findByIsActive(Boolean isActive, Pageable pageable);
    Page<Team> findByManagerId(Long managerId, Pageable pageable);

    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.id = :userId")
    Page<Team> findByMemberId(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT t FROM Team t WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Team> searchTeams(@Param("search") String search, Pageable pageable);

    boolean existsByName(String name);
}

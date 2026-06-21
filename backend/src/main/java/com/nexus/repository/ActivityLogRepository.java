package com.nexus.repository;

import com.nexus.entity.ActivityLog;
import com.nexus.enums.ActivityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    Page<ActivityLog> findByUserId(Long userId, Pageable pageable);
    Page<ActivityLog> findByProjectId(Long projectId, Pageable pageable);
    Page<ActivityLog> findByActivityType(ActivityType activityType, Pageable pageable);
    Page<ActivityLog> findByEntityTypeAndEntityId(String entityType, Long entityId, Pageable pageable);
}

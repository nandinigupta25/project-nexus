package com.nexus.service;

import com.nexus.entity.ActivityLog;
import com.nexus.entity.Project;
import com.nexus.entity.User;
import com.nexus.enums.ActivityType;
import com.nexus.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Async
    @Transactional
    public void log(ActivityType type, String description, String entityType, Long entityId, User user) {
        log(type, description, entityType, entityId, user, null, null, null);
    }

    @Async
    @Transactional
    public void log(ActivityType type, String description, String entityType, Long entityId,
                    User user, Project project, String oldValue, String newValue) {
        try {
            ActivityLog log = ActivityLog.builder()
                .activityType(type)
                .description(description)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .project(project)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
            activityLogRepository.save(log);
        } catch (Exception e) {
            log.error("Failed to save activity log: {}", e.getMessage());
        }
    }

    public Page<ActivityLog> getUserActivity(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserId(userId, pageable);
    }

    public Page<ActivityLog> getProjectActivity(Long projectId, Pageable pageable) {
        return activityLogRepository.findByProjectId(projectId, pageable);
    }

    public Page<ActivityLog> getAllActivity(Pageable pageable) {
        return activityLogRepository.findAll(pageable);
    }
}

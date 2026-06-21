package com.nexus.service;

import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.*;
import com.nexus.enums.NotificationType;
import com.nexus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Async
    @Transactional
    public void notifyTaskAssigned(Task task, User assignedBy) {
        if (task.getAssignee() == null) return;

        Notification notification = Notification.builder()
            .title("Task Assigned")
            .message(assignedBy.getFullName() + " assigned you a task: " + task.getTitle())
            .type(NotificationType.TASK_ASSIGNED)
            .recipient(task.getAssignee())
            .sender(assignedBy)
            .entityId(task.getId())
            .entityType("TASK")
            .build();

        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void notifyTaskStatusChanged(Task task, String oldStatus, User changedBy) {
        if (task.getAssignee() == null || task.getAssignee().getId().equals(changedBy.getId())) return;

        Notification notification = Notification.builder()
            .title("Task Status Updated")
            .message("Task '" + task.getTitle() + "' status changed from " + oldStatus + " to " + task.getStatus())
            .type(NotificationType.TASK_STATUS_CHANGED)
            .recipient(task.getAssignee())
            .sender(changedBy)
            .entityId(task.getId())
            .entityType("TASK")
            .build();

        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void notifyCommentAdded(Task task, User commentedBy) {
        if (task.getAssignee() == null || task.getAssignee().getId().equals(commentedBy.getId())) return;

        Notification notification = Notification.builder()
            .title("New Comment")
            .message(commentedBy.getFullName() + " commented on task: " + task.getTitle())
            .type(NotificationType.COMMENT_ADDED)
            .recipient(task.getAssignee())
            .sender(commentedBy)
            .entityId(task.getId())
            .entityType("TASK")
            .build();

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository
            .findByRecipientIdOrderByCreatedAtDesc(userId, pageable);

        return PagedResponse.<NotificationResponse>builder()
            .content(notifications.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
            .page(notifications.getNumber())
            .size(notifications.getSize())
            .totalElements(notifications.getTotalElements())
            .totalPages(notifications.getTotalPages())
            .last(notifications.isLast())
            .first(notifications.isFirst())
            .build();
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getRecipient().getId().equals(userId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsRead(userId, false);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
            .id(notification.getId())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .type(notification.getType())
            .isRead(notification.getIsRead())
            .entityId(notification.getEntityId())
            .entityType(notification.getEntityType())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}
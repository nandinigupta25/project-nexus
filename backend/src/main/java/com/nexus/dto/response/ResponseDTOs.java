package com.nexus.dto.response;

import com.nexus.enums.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class ResponseDTOs {

    @Data @Builder
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn;
        private UserResponse user;
    }

    @Data @Builder
    public static class UserResponse {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private Role role;
        private String avatarUrl;
        private String jobTitle;
        private String phone;
        private String bio;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class ProjectResponse {
        private Long id;
        private String name;
        private String description;
        private ProjectStatus status;
        private Priority priority;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer progress;
        private Double budget;
        private Boolean isArchived;
        private UserResponse owner;
        private TeamSummaryResponse team;
        private Set<UserResponse> members;
        private String tags;
        private long totalTasks;
        private long completedTasks;
        private long pendingTasks;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @Builder
    public static class TaskResponse {
        private Long id;
        private String title;
        private String description;
        private TaskStatus status;
        private Priority priority;
        private LocalDate dueDate;
        private Double estimatedHours;
        private Double actualHours;
        private Integer position;
        private Long projectId;
        private String projectName;
        private UserResponse assignee;
        private UserResponse reporter;
        private Long parentTaskId;
        private List<TaskSummaryResponse> subTasks;
        private long commentCount;
        private long attachmentCount;
        private String tags;
        private boolean overdue;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @Builder
    public static class TaskSummaryResponse {
        private Long id;
        private String title;
        private TaskStatus status;
        private Priority priority;
        private LocalDate dueDate;
        private UserResponse assignee;
    }

    @Data @Builder
    public static class TeamResponse {
        private Long id;
        private String name;
        private String description;
        private String avatarColor;
        private UserResponse manager;
        private Set<UserResponse> members;
        private int memberCount;
        private long projectCount;
        private Boolean isActive;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class TeamSummaryResponse {
        private Long id;
        private String name;
        private String avatarColor;
        private int memberCount;
    }

    @Data @Builder
    public static class CommentResponse {
        private Long id;
        private String content;
        private UserResponse author;
        private Long parentCommentId;
        private Boolean isEdited;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @Builder
    public static class AttachmentResponse {
        private Long id;
        private String fileName;
        private String fileUrl;
        private String fileType;
        private Long fileSize;
        private UserResponse uploadedBy;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class NotificationResponse {
        private Long id;
        private String title;
        private String message;
        private NotificationType type;
        private Boolean isRead;
        private Long entityId;
        private String entityType;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class ActivityLogResponse {
        private Long id;
        private ActivityType activityType;
        private String description;
        private String entityType;
        private Long entityId;
        private UserResponse user;
        private LocalDateTime createdAt;
    }

    @Data @Builder
    public static class DashboardStats {
        private long totalProjects;
        private long activeProjects;
        private long completedProjects;
        private long onHoldProjects;
        private long totalTasks;
        private long completedTasks;
        private long pendingTasks;
        private long overdueTasks;
        private long totalTeams;
        private long totalMembers;
        private List<ProjectStatusCount> projectsByStatus;
        private List<TaskPriorityCount> tasksByPriority;
        private List<MonthlyActivity> monthlyActivity;
    }

    @Data @Builder
    public static class ProjectStatusCount {
        private String status;
        private long count;
    }

    @Data @Builder
    public static class TaskPriorityCount {
        private String priority;
        private long count;
    }

    @Data @Builder
    public static class MonthlyActivity {
        private String month;
        private long tasksCreated;
        private long tasksCompleted;
    }

    @Data @Builder
    public static class KanbanBoardResponse {
        private Long projectId;
        private String projectName;
        private List<TaskResponse> todo;
        private List<TaskResponse> inProgress;
        private List<TaskResponse> review;
        private List<TaskResponse> completed;
    }

    @Data @Builder
    public static class PagedResponse<T> {
        private List<T> content;
        private int page;
        private int size;
        private long totalElements;
        private int totalPages;
        private boolean last;
        private boolean first;
    }

    @Data @Builder
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;
        private LocalDateTime timestamp;

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
        }

        public static <T> ApiResponse<T> success(String message, T data) {
            return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
        }

        public static <T> ApiResponse<T> error(String message) {
            return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
        }
    }
}

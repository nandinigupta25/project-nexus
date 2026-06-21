package com.nexus.service.impl;

import com.nexus.dto.request.TaskRequest;
import com.nexus.dto.request.KanbanMoveRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.*;
import com.nexus.enums.ActivityType;
import com.nexus.enums.TaskStatus;
import com.nexus.exception.ResourceNotFoundException;
import com.nexus.repository.*;
import com.nexus.service.ActivityLogService;
import com.nexus.service.NotificationService;
import com.nexus.service.TaskService;
import com.nexus.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final SecurityUtils securityUtils;

    @Override
    public TaskResponse createTask(TaskRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Project project = projectRepository.findById(request.getProjectId())
            .orElseThrow(() -> new ResourceNotFoundException("Project", request.getProjectId()));

        Task task = Task.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
            .priority(request.getPriority())
            .dueDate(request.getDueDate())
            .estimatedHours(request.getEstimatedHours())
            .tags(request.getTags())
            .project(project)
            .reporter(currentUser)
            .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssigneeId()));
            task.setAssignee(assignee);
        }

        if (request.getParentTaskId() != null) {
            Task parentTask = taskRepository.findById(request.getParentTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task", request.getParentTaskId()));
            task.setParentTask(parentTask);
        }

        task = taskRepository.save(task);

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(currentUser.getId())) {
            notificationService.notifyTaskAssigned(task, currentUser);
        }

        activityLogService.log(ActivityType.TASK_CREATED,
            "Task created: " + task.getTitle(), "TASK", task.getId(), currentUser, project, null, null);

        return mapToTaskResponse(task);
    }

    @Override
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = getTaskById(id);
        User currentUser = securityUtils.getCurrentUser();
        String oldStatus = task.getStatus().name();

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getStatus() != null) task.setStatus(request.getStatus());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setTags(request.getTags());

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getAssigneeId()));
            boolean assigneeChanged = task.getAssignee() == null ||
                !task.getAssignee().getId().equals(request.getAssigneeId());
            task.setAssignee(assignee);
            if (assigneeChanged && !assignee.getId().equals(currentUser.getId())) {
                notificationService.notifyTaskAssigned(task, currentUser);
            }
        } else {
            task.setAssignee(null);
        }

        task = taskRepository.save(task);

        if (!oldStatus.equals(task.getStatus().name())) {
            notificationService.notifyTaskStatusChanged(task, oldStatus, currentUser);
            activityLogService.log(ActivityType.TASK_STATUS_CHANGED,
                "Task status changed: " + task.getTitle(), "TASK", task.getId(),
                currentUser, task.getProject(), oldStatus, task.getStatus().name());
        } else {
            activityLogService.log(ActivityType.TASK_UPDATED,
                "Task updated: " + task.getTitle(), "TASK", task.getId(), currentUser, task.getProject(), null, null);
        }

        return mapToTaskResponse(task);
    }

    @Override
    public void deleteTask(Long id) {
        Task task = getTaskById(id);
        User currentUser = securityUtils.getCurrentUser();

        activityLogService.log(ActivityType.TASK_DELETED,
            "Task deleted: " + task.getTitle(), "TASK", task.getId(), currentUser, task.getProject(), null, null);

        taskRepository.delete(task);
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) {
        return mapToTaskResponse(getTaskById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TaskResponse> getProjectTasks(Long projectId, Pageable pageable) {
        Page<Task> tasks = taskRepository.findByProjectId(projectId, pageable);
        return toPagedResponse(tasks.map(this::mapToTaskResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TaskResponse> getMyTasks(Pageable pageable) {
        User currentUser = securityUtils.getCurrentUser();
        Page<Task> tasks = taskRepository.findByAssigneeId(currentUser.getId(), pageable);
        return toPagedResponse(tasks.map(this::mapToTaskResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TaskResponse> searchTasks(String query, Pageable pageable) {
        Page<Task> tasks = taskRepository.searchTasks(query, pageable);
        return toPagedResponse(tasks.map(this::mapToTaskResponse));
    }

    @Override
    public TaskResponse moveTask(KanbanMoveRequest request) {
        Task task = getTaskById(request.getTaskId());
        User currentUser = securityUtils.getCurrentUser();
        String oldStatus = task.getStatus().name();

        task.setStatus(request.getNewStatus());
        if (request.getNewPosition() != null) {
            task.setPosition(request.getNewPosition());
        }

        task = taskRepository.save(task);

        if (!oldStatus.equals(task.getStatus().name())) {
            notificationService.notifyTaskStatusChanged(task, oldStatus, currentUser);
        }

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional(readOnly = true)
    public KanbanBoardResponse getKanbanBoard(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        List<TaskResponse> todo = taskRepository
            .findByProjectIdAndStatus(projectId, TaskStatus.TODO)
            .stream().map(this::mapToTaskResponse).collect(Collectors.toList());

        List<TaskResponse> inProgress = taskRepository
            .findByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS)
            .stream().map(this::mapToTaskResponse).collect(Collectors.toList());

        List<TaskResponse> review = taskRepository
            .findByProjectIdAndStatus(projectId, TaskStatus.REVIEW)
            .stream().map(this::mapToTaskResponse).collect(Collectors.toList());

        List<TaskResponse> completed = taskRepository
            .findByProjectIdAndStatus(projectId, TaskStatus.COMPLETED)
            .stream().map(this::mapToTaskResponse).collect(Collectors.toList());

        return KanbanBoardResponse.builder()
            .projectId(project.getId())
            .projectName(project.getName())
            .todo(todo)
            .inProgress(inProgress)
            .review(review)
            .completed(completed)
            .build();
    }

    private Task getTaskById(Long id) {
        return taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task", id));
    }

    private TaskResponse mapToTaskResponse(Task task) {
        long commentCount = commentRepository.countByTaskId(task.getId());
        long attachmentCount = attachmentRepository.findByTaskId(task.getId()).size();

        return TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus())
            .priority(task.getPriority())
            .dueDate(task.getDueDate())
            .estimatedHours(task.getEstimatedHours())
            .actualHours(task.getActualHours())
            .position(task.getPosition())
            .projectId(task.getProject().getId())
            .projectName(task.getProject().getName())
            .assignee(task.getAssignee() != null ? mapUserToResponse(task.getAssignee()) : null)
            .reporter(task.getReporter() != null ? mapUserToResponse(task.getReporter()) : null)
            .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
            .subTasks(task.getSubTasks().stream().map(this::mapToTaskSummary).collect(Collectors.toList()))
            .commentCount(commentCount)
            .attachmentCount(attachmentCount)
            .tags(task.getTags())
            .overdue(task.getDueDate() != null &&
                task.getDueDate().isBefore(LocalDate.now()) &&
                task.getStatus() != TaskStatus.COMPLETED)
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }

    private TaskSummaryResponse mapToTaskSummary(Task task) {
        return TaskSummaryResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .status(task.getStatus())
            .priority(task.getPriority())
            .dueDate(task.getDueDate())
            .assignee(task.getAssignee() != null ? mapUserToResponse(task.getAssignee()) : null)
            .build();
    }

    private UserResponse mapUserToResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
            .id(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .role(user.getRole())
            .avatarUrl(user.getAvatarUrl())
            .jobTitle(user.getJobTitle())
            .build();
    }

    private <T> PagedResponse<T> toPagedResponse(Page<T> page) {
        return PagedResponse.<T>builder()
            .content(page.getContent())
            .page(page.getNumber())
            .size(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .last(page.isLast())
            .first(page.isFirst())
            .build();
    }
}

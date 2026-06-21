package com.nexus.service.impl;

import com.nexus.dto.request.ProjectRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.Project;
import com.nexus.entity.Team;
import com.nexus.entity.User;
import com.nexus.enums.ActivityType;
import com.nexus.enums.ProjectStatus;
import com.nexus.exception.BadRequestException;
import com.nexus.exception.ResourceNotFoundException;
import com.nexus.repository.ProjectRepository;
import com.nexus.repository.TaskRepository;
import com.nexus.repository.TeamRepository;
import com.nexus.repository.UserRepository;
import com.nexus.service.ActivityLogService;
import com.nexus.service.ProjectService;
import com.nexus.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final ActivityLogService activityLogService;
    private final SecurityUtils securityUtils;

    @Override
    public ProjectResponse createProject(ProjectRequest request) {
        User currentUser = securityUtils.getCurrentUser();

        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING)
            .priority(request.getPriority())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .budget(request.getBudget())
            .tags(request.getTags())
            .owner(currentUser)
            .build();

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
            project.setTeam(team);
        }

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            Set<User> members = new HashSet<>(userRepository.findAllById(request.getMemberIds()));
            project.setMembers(members);
        }

        project = projectRepository.save(project);

        activityLogService.log(ActivityType.PROJECT_CREATED,
            "Project created: " + project.getName(), "PROJECT", project.getId(), currentUser, project, null, null);

        log.info("Project created: {} by {}", project.getName(), currentUser.getEmail());
        return mapToProjectResponse(project);
    }

    @Override
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = getProjectById(id);
        User currentUser = securityUtils.getCurrentUser();

        String oldStatus = project.getStatus().name();

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getPriority() != null) project.setPriority(request.getPriority());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setBudget(request.getBudget());
        project.setTags(request.getTags());

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team", request.getTeamId()));
            project.setTeam(team);
        }

        if (request.getMemberIds() != null) {
            Set<User> members = new HashSet<>(userRepository.findAllById(request.getMemberIds()));
            project.setMembers(members);
        }

        project = projectRepository.save(project);

        activityLogService.log(ActivityType.PROJECT_UPDATED,
            "Project updated: " + project.getName(), "PROJECT", project.getId(),
            currentUser, project, oldStatus, project.getStatus().name());

        return mapToProjectResponse(project);
    }

    @Override
    @PreAuthorize("hasRole('ADMIN') or @securityUtils.isProjectOwner(#id)")
    public void deleteProject(Long id) {
        Project project = getProjectById(id);
        User currentUser = securityUtils.getCurrentUser();

        activityLogService.log(ActivityType.PROJECT_DELETED,
            "Project deleted: " + project.getName(), "PROJECT", project.getId(), currentUser, null, null, null);

        projectRepository.delete(project);
        log.info("Project deleted: {}", id);
    }

    @Override
    public ProjectResponse archiveProject(Long id) {
        Project project = getProjectById(id);
        User currentUser = securityUtils.getCurrentUser();

        project.setIsArchived(true);
        project.setStatus(ProjectStatus.ARCHIVED);
        project = projectRepository.save(project);

        activityLogService.log(ActivityType.PROJECT_ARCHIVED,
            "Project archived: " + project.getName(), "PROJECT", project.getId(), currentUser, project, null, null);

        return mapToProjectResponse(project);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long id) {
        return mapToProjectResponse(getProjectById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getAllProjects(Pageable pageable) {
        Page<Project> projects = projectRepository.findByIsArchived(false, pageable);
        return toPagedResponse(projects.map(this::mapToProjectResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> searchProjects(String query, Pageable pageable) {
        Page<Project> projects = projectRepository.searchProjects(query, pageable);
        return toPagedResponse(projects.map(this::mapToProjectResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getProjectsByStatus(ProjectStatus status, Pageable pageable) {
        Page<Project> projects = projectRepository.findByStatus(status, pageable);
        return toPagedResponse(projects.map(this::mapToProjectResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ProjectResponse> getMyProjects(Pageable pageable) {
        User currentUser = securityUtils.getCurrentUser();
        Page<Project> projects = projectRepository.findByOwnerId(currentUser.getId(), pageable);
        return toPagedResponse(projects.map(this::mapToProjectResponse));
    }

    @Override
    public ProjectResponse updateProgress(Long id, Integer progress) {
        Project project = getProjectById(id);
        if (progress < 0 || progress > 100) {
            throw new BadRequestException("Progress must be between 0 and 100");
        }
        project.setProgress(progress);
        return mapToProjectResponse(projectRepository.save(project));
    }

    private Project getProjectById(Long id) {
        return projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private ProjectResponse mapToProjectResponse(Project project) {
        long totalTasks = taskRepository.countByProjectId(project.getId());
        long completedTasks = taskRepository.countByProjectIdAndStatus(project.getId(),
            com.nexus.enums.TaskStatus.COMPLETED);

        return ProjectResponse.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .status(project.getStatus())
            .priority(project.getPriority())
            .startDate(project.getStartDate())
            .endDate(project.getEndDate())
            .progress(project.getProgress())
            .budget(project.getBudget())
            .isArchived(project.getIsArchived())
            .owner(mapUserToResponse(project.getOwner()))
            .team(project.getTeam() != null ? mapTeamSummary(project.getTeam()) : null)
            .members(project.getMembers() != null ?
                project.getMembers().stream().map(this::mapUserToResponse).collect(Collectors.toSet()) : null)
            .tags(project.getTags())
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .pendingTasks(totalTasks - completedTasks)
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
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

    private TeamSummaryResponse mapTeamSummary(Team team) {
        return TeamSummaryResponse.builder()
            .id(team.getId())
            .name(team.getName())
            .avatarColor(team.getAvatarColor())
            .memberCount(team.getMembers().size())
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

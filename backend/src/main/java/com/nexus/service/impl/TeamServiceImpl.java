package com.nexus.service.impl;

import com.nexus.dto.request.TeamRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.Team;
import com.nexus.entity.User;
import com.nexus.enums.ActivityType;
import com.nexus.exception.BadRequestException;
import com.nexus.exception.DuplicateResourceException;
import com.nexus.exception.ResourceNotFoundException;
import com.nexus.repository.TeamRepository;
import com.nexus.repository.UserRepository;
import com.nexus.service.ActivityLogService;
import com.nexus.service.TeamService;
import com.nexus.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final SecurityUtils securityUtils;

    @Override
    public TeamResponse createTeam(TeamRequest request) {
        if (teamRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Team with name '" + request.getName() + "' already exists");
        }

        User currentUser = securityUtils.getCurrentUser();

        Team team = Team.builder()
            .name(request.getName())
            .description(request.getDescription())
            .avatarColor(request.getAvatarColor() != null ? request.getAvatarColor() : "#6366f1")
            .build();

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getManagerId()));
            team.setManager(manager);
        } else {
            team.setManager(currentUser);
        }

        if (request.getMemberIds() != null && !request.getMemberIds().isEmpty()) {
            Set<User> members = new HashSet<>(userRepository.findAllById(request.getMemberIds()));
            team.setMembers(members);
        }

        team = teamRepository.save(team);
        activityLogService.log(ActivityType.TEAM_CREATED, "Team created: " + team.getName(), "TEAM", team.getId(), currentUser);

        return mapToTeamResponse(team);
    }

    @Override
    public TeamResponse updateTeam(Long id, TeamRequest request) {
        Team team = getTeamById(id);
        User currentUser = securityUtils.getCurrentUser();

        if (!team.getName().equals(request.getName()) && teamRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("Team with name '" + request.getName() + "' already exists");
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        if (request.getAvatarColor() != null) team.setAvatarColor(request.getAvatarColor());

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getManagerId()));
            team.setManager(manager);
        }

        if (request.getMemberIds() != null) {
            Set<User> members = new HashSet<>(userRepository.findAllById(request.getMemberIds()));
            team.setMembers(members);
        }

        team = teamRepository.save(team);
        return mapToTeamResponse(team);
    }

    @Override
    public void deleteTeam(Long id) {
        Team team = getTeamById(id);
        User currentUser = securityUtils.getCurrentUser();
        activityLogService.log(ActivityType.TEAM_CREATED, "Team deleted: " + team.getName(), "TEAM", team.getId(), currentUser);
        teamRepository.delete(team);
    }

    @Override
    @Transactional(readOnly = true)
    public TeamResponse getTeam(Long id) {
        return mapToTeamResponse(getTeamById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TeamResponse> getAllTeams(Pageable pageable) {
        Page<Team> teams = teamRepository.findByIsActive(true, pageable);
        return toPagedResponse(teams.map(this::mapToTeamResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TeamResponse> searchTeams(String query, Pageable pageable) {
        Page<Team> teams = teamRepository.searchTeams(query, pageable);
        return toPagedResponse(teams.map(this::mapToTeamResponse));
    }

    @Override
    public TeamResponse addMember(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        User currentUser = securityUtils.getCurrentUser();

        if (team.getMembers().stream().anyMatch(m -> m.getId().equals(userId))) {
            throw new BadRequestException("User is already a member of this team");
        }

        team.getMembers().add(user);
        team = teamRepository.save(team);

        activityLogService.log(ActivityType.TEAM_MEMBER_ADDED,
            user.getFullName() + " added to team: " + team.getName(), "TEAM", team.getId(), currentUser);

        return mapToTeamResponse(team);
    }

    @Override
    public TeamResponse removeMember(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User currentUser = securityUtils.getCurrentUser();

        User userToRemove = team.getMembers().stream()
            .filter(m -> m.getId().equals(userId))
            .findFirst()
            .orElseThrow(() -> new BadRequestException("User is not a member of this team"));

        team.getMembers().remove(userToRemove);
        team = teamRepository.save(team);

        activityLogService.log(ActivityType.TEAM_MEMBER_REMOVED,
            userToRemove.getFullName() + " removed from team: " + team.getName(), "TEAM", team.getId(), currentUser);

        return mapToTeamResponse(team);
    }

    @Override
    public TeamResponse assignManager(Long teamId, Long userId) {
        Team team = getTeamById(teamId);
        User manager = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        team.setManager(manager);
        return mapToTeamResponse(teamRepository.save(team));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<TeamResponse> getMyTeams(Pageable pageable) {
        User currentUser = securityUtils.getCurrentUser();
        Page<Team> teams = teamRepository.findByMemberId(currentUser.getId(), pageable);
        return toPagedResponse(teams.map(this::mapToTeamResponse));
    }

    private Team getTeamById(Long id) {
        return teamRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Team", id));
    }

    private TeamResponse mapToTeamResponse(Team team) {
        return TeamResponse.builder()
            .id(team.getId())
            .name(team.getName())
            .description(team.getDescription())
            .avatarColor(team.getAvatarColor())
            .manager(team.getManager() != null ? mapUserToResponse(team.getManager()) : null)
            .members(team.getMembers().stream().map(this::mapUserToResponse).collect(Collectors.toSet()))
            .memberCount(team.getMembers().size())
            .projectCount(team.getProjects().size())
            .isActive(team.getIsActive())
            .createdAt(team.getCreatedAt())
            .build();
    }

    private UserResponse mapUserToResponse(User user) {
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

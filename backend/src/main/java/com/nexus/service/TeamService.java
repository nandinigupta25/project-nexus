package com.nexus.service;

import com.nexus.dto.request.TeamRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import org.springframework.data.domain.Pageable;

public interface TeamService {
    TeamResponse createTeam(TeamRequest request);
    TeamResponse updateTeam(Long id, TeamRequest request);
    void deleteTeam(Long id);
    TeamResponse getTeam(Long id);
    PagedResponse<TeamResponse> getAllTeams(Pageable pageable);
    PagedResponse<TeamResponse> searchTeams(String query, Pageable pageable);
    TeamResponse addMember(Long teamId, Long userId);
    TeamResponse removeMember(Long teamId, Long userId);
    TeamResponse assignManager(Long teamId, Long userId);
    PagedResponse<TeamResponse> getMyTeams(Pageable pageable);
}

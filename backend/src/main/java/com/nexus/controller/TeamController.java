package com.nexus.controller;

import com.nexus.dto.request.TeamRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team management endpoints")
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new team")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(@Valid @RequestBody TeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Team created", teamService.createTeam(request)));
    }

    @GetMapping
    @Operation(summary = "Get all teams")
    public ResponseEntity<ApiResponse<PagedResponse<TeamResponse>>> getAllTeams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams(PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get team by ID")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeam(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeam(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a team")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeam(
            @PathVariable Long id, @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Team updated", teamService.updateTeam(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a team")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success("Team deleted", null));
    }

    @PostMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Add member to team")
    public ResponseEntity<ApiResponse<TeamResponse>> addMember(
            @PathVariable Long teamId, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Member added", teamService.addMember(teamId, userId)));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Remove member from team")
    public ResponseEntity<ApiResponse<TeamResponse>> removeMember(
            @PathVariable Long teamId, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Member removed", teamService.removeMember(teamId, userId)));
    }

    @PatchMapping("/{teamId}/manager/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Assign team manager")
    public ResponseEntity<ApiResponse<TeamResponse>> assignManager(
            @PathVariable Long teamId, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success("Manager assigned", teamService.assignManager(teamId, userId)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's teams")
    public ResponseEntity<ApiResponse<PagedResponse<TeamResponse>>> getMyTeams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getMyTeams(PageRequest.of(page, size))));
    }

    @GetMapping("/search")
    @Operation(summary = "Search teams")
    public ResponseEntity<ApiResponse<PagedResponse<TeamResponse>>> searchTeams(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(teamService.searchTeams(q, pageable)));
    }
}

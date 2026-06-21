package com.nexus.controller;

import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.ActivityLog;
import com.nexus.service.ActivityLogService;
import com.nexus.util.SecurityUtils;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/activity-logs")
@RequiredArgsConstructor
@Tag(name = "Activity Logs")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final SecurityUtils securityUtils;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ActivityLogResponse>>> getAllActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ActivityLog> logs = activityLogService.getAllActivity(
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(toPagedResponse(logs)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PagedResponse<ActivityLogResponse>>> getMyActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = securityUtils.getCurrentUser().getId();
        Page<ActivityLog> logs = activityLogService.getUserActivity(userId,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(toPagedResponse(logs)));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<PagedResponse<ActivityLogResponse>>> getProjectActivity(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ActivityLog> logs = activityLogService.getProjectActivity(projectId,
            PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.success(toPagedResponse(logs)));
    }

    private PagedResponse<ActivityLogResponse> toPagedResponse(Page<ActivityLog> logs) {
        return PagedResponse.<ActivityLogResponse>builder()
            .content(logs.getContent().stream().map(log -> ActivityLogResponse.builder()
                .id(log.getId())
                .activityType(log.getActivityType())
                .description(log.getDescription())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .createdAt(log.getCreatedAt())
                .build()).collect(Collectors.toList()))
            .page(logs.getNumber()).size(logs.getSize())
            .totalElements(logs.getTotalElements()).totalPages(logs.getTotalPages())
            .last(logs.isLast()).first(logs.isFirst())
            .build();
    }
}

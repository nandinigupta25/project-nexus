package com.nexus.controller;

import com.nexus.dto.request.UpdateProfileRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.entity.User;
import com.nexus.exception.ResourceNotFoundException;
import com.nexus.repository.UserRepository;
import com.nexus.service.ActivityLogService;
import com.nexus.enums.ActivityType;
import com.nexus.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management endpoints")
public class UserController {

    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final ActivityLogService activityLogService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(user)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = securityUtils.getCurrentUser();

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getJobTitle() != null) user.setJobTitle(request.getJobTitle());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getBio() != null) user.setBio(request.getBio());

        user = userRepository.save(user);
        activityLogService.log(ActivityType.PROFILE_UPDATED, "Profile updated", "USER", user.getId(), user);

        return ResponseEntity.ok(ApiResponse.success("Profile updated", mapToResponse(user)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Get all users (Admin/PM only)")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search) {

        Page<User> users = search.isEmpty()
            ? userRepository.findAll(PageRequest.of(page, size, Sort.by("firstName")))
            : userRepository.searchUsers(search, PageRequest.of(page, size, Sort.by("firstName")));

        return ResponseEntity.ok(ApiResponse.success(PagedResponse.<UserResponse>builder()
            .content(users.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
            .page(users.getNumber()).size(users.getSize())
            .totalElements(users.getTotalElements()).totalPages(users.getTotalPages())
            .last(users.isLast()).first(users.isFirst())
            .build()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(user)));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate/deactivate user (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserActive(
            @PathVariable Long id, @RequestParam Boolean active) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setIsActive(active);
        user = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(
            "User " + (active ? "activated" : "deactivated"), mapToResponse(user)));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .email(user.getEmail())
            .role(user.getRole())
            .avatarUrl(user.getAvatarUrl())
            .jobTitle(user.getJobTitle())
            .phone(user.getPhone())
            .bio(user.getBio())
            .isActive(user.getIsActive())
            .createdAt(user.getCreatedAt())
            .build();
    }
}

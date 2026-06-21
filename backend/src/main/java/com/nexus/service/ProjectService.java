package com.nexus.service;

import com.nexus.dto.request.ProjectRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.enums.ProjectStatus;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    ProjectResponse createProject(ProjectRequest request);
    ProjectResponse updateProject(Long id, ProjectRequest request);
    void deleteProject(Long id);
    ProjectResponse archiveProject(Long id);
    ProjectResponse getProject(Long id);
    PagedResponse<ProjectResponse> getAllProjects(Pageable pageable);
    PagedResponse<ProjectResponse> searchProjects(String query, Pageable pageable);
    PagedResponse<ProjectResponse> getProjectsByStatus(ProjectStatus status, Pageable pageable);
    PagedResponse<ProjectResponse> getMyProjects(Pageable pageable);
    ProjectResponse updateProgress(Long id, Integer progress);
}

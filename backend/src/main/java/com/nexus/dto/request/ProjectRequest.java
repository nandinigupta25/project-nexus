package com.nexus.dto.request;

import com.nexus.enums.Priority;
import com.nexus.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class ProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 150, message = "Project name must be between 3 and 150 characters")
    private String name;

    @Size(max = 5000)
    private String description;

    private ProjectStatus status;
    private Priority priority;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;
    private Long teamId;
    private Set<Long> memberIds;
    private String tags;
}

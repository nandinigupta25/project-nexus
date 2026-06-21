package com.nexus.dto.request;

import com.nexus.enums.Priority;
import com.nexus.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @Size(max = 10000)
    private String description;

    private TaskStatus status;
    private Priority priority;
    private LocalDate dueDate;
    private Double estimatedHours;
    private Long assigneeId;
    private Long reporterId;
    private Long parentTaskId;
    private String tags;

    @NotNull(message = "Project ID is required")
    private Long projectId;
}

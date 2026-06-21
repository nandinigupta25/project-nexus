package com.nexus.controller;

import com.nexus.dto.request.KanbanMoveRequest;
import com.nexus.dto.request.TaskRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import com.nexus.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Task created", taskService.createTask(request)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get task by ID")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTask(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a task")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Task updated", taskService.updateTask(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get tasks by project")
    public ResponseEntity<ApiResponse<PagedResponse<TaskResponse>>> getProjectTasks(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(taskService.getProjectTasks(projectId, pageable)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get tasks assigned to current user")
    public ResponseEntity<ApiResponse<PagedResponse<TaskResponse>>> getMyTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dueDate").ascending());
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks(pageable)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search tasks")
    public ResponseEntity<ApiResponse<PagedResponse<TaskResponse>>> searchTasks(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(taskService.searchTasks(q, pageable)));
    }

    @PatchMapping("/move")
    @Operation(summary = "Move task on kanban board")
    public ResponseEntity<ApiResponse<TaskResponse>> moveTask(@Valid @RequestBody KanbanMoveRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Task moved", taskService.moveTask(request)));
    }

    @GetMapping("/kanban/{projectId}")
    @Operation(summary = "Get kanban board for a project")
    public ResponseEntity<ApiResponse<KanbanBoardResponse>> getKanbanBoard(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getKanbanBoard(projectId)));
    }
}

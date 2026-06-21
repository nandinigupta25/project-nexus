package com.nexus.service;

import com.nexus.dto.request.KanbanMoveRequest;
import com.nexus.dto.request.TaskRequest;
import com.nexus.dto.response.ResponseDTOs.*;
import org.springframework.data.domain.Pageable;

public interface TaskService {
    TaskResponse createTask(TaskRequest request);
    TaskResponse updateTask(Long id, TaskRequest request);
    void deleteTask(Long id);
    TaskResponse getTask(Long id);
    PagedResponse<TaskResponse> getProjectTasks(Long projectId, Pageable pageable);
    PagedResponse<TaskResponse> getMyTasks(Pageable pageable);
    PagedResponse<TaskResponse> searchTasks(String query, Pageable pageable);
    TaskResponse moveTask(KanbanMoveRequest request);
    KanbanBoardResponse getKanbanBoard(Long projectId);
}

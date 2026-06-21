package com.nexus.dto.request;

import com.nexus.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class KanbanMoveRequest {
    @NotNull
    private Long taskId;
    @NotNull
    private TaskStatus newStatus;
    private Integer newPosition;
}

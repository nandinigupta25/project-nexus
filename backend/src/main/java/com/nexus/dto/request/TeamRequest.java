package com.nexus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.Set;

@Data
public class TeamRequest {
    @NotBlank(message = "Team name is required")
    @Size(min = 2, max = 100)
    private String name;

    @Size(max = 2000)
    private String description;
    private Long managerId;
    private Set<Long> memberIds;
    private String avatarColor;
}

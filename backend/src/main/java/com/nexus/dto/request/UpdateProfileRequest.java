package com.nexus.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 50)
    private String firstName;
    @Size(min = 2, max = 50)
    private String lastName;
    @Size(max = 100)
    private String jobTitle;
    @Size(max = 20)
    private String phone;
    @Size(max = 500)
    private String bio;
}

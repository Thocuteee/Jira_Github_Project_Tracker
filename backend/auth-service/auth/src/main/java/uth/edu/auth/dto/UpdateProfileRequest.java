package uth.edu.auth.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 1024, message = "Avatar URL tối đa 1024 ký tự")
    private String avatarUrl;
}

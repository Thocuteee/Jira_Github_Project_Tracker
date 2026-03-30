package uth.edu.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
public class TokenRefreshRequest {
    @NotBlank
    private String refreshToken;
}
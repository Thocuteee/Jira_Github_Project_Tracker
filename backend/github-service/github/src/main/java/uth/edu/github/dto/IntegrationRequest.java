package uth.edu.github.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class IntegrationRequest {
    @NotNull(message = "groupId không được để trống")
    private UUID groupId;

    private String githubToken;

    private String githubRepo;

    private String jiraProjectKey;
}
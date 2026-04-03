package uth.edu.github.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class GithubRepositoryRequest {
    @NotNull(message = "groupId không được để trống")
    private UUID groupId;

    @NotBlank(message = "repoName không được để trống")
    private String repoName;

    private String repoUrl;
}
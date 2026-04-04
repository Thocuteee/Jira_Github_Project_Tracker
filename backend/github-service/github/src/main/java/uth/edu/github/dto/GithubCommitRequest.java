package uth.edu.github.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class GithubCommitRequest {
    @NotNull(message = "groupId không được để trống")
    private UUID groupId;

    @NotNull(message = "repoId không được để trống")
    private UUID repoId;

    @NotNull(message = "userId không được để trống")
    private UUID userId;

    @NotBlank(message = "commitHash không được để trống")
    private String commitHash;

    private String message;
    private String commitFile;
}
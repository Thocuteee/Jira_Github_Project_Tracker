package uth.edu.github.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class GithubRepositoryResponse {
    private UUID repoId;
    private UUID groupId;
    private String repoName;
    private String repoUrl;
    private LocalDateTime createdAt;
}
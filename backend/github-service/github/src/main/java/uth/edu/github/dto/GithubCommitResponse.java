package uth.edu.github.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class GithubCommitResponse {
    private UUID commitId;
    private UUID groupId;
    private UUID repoId;
    private String repoName;
    private UUID userId;
    private String commitHash;
    private String message;
    private String commitFile;
    private String authorName;
    private LocalDateTime committedAt;
}
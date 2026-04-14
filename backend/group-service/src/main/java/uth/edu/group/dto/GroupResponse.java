package uth.edu.group.dto;

import lombok.Data;
import java.util.UUID;
import java.time.LocalDateTime;

@Data
public class GroupResponse {
    private UUID groupId;
    private String groupName;
    private UUID leaderId;
    private LocalDateTime createdAt;
    private String jiraProjectKey;
    private String githubRepoUrl;
    private String workspaceId;
    private String description;
    private String status;
}
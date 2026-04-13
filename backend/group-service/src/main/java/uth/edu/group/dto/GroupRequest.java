package uth.edu.group.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class GroupRequest {
    private String groupName;
    private UUID leaderId;
    private String jiraProjectKey;
    private String githubRepoUrl;
    private String workspaceId;
    private String description;
    private String status;
}
package uth.edu.jira.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JiraResponse {
    private UUID jiraId;
    private UUID userId;
    private String jiraUrl;
    private String projectKey;
    private UUID groupId;
    private LocalDateTime createdAt;
}
package uth.edu.github.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class IntegrationResponse {
    private UUID integrationId;
    private UUID groupId;
    private String githubToken;
    private String githubRepo;
    private String jiraProjectKey;
    private LocalDateTime createdAt;
}
package uth.edu.jira.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JiraRequest {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotBlank(message = "jiraUrl is required")
    private String jiraUrl;

    @NotBlank(message = "projectKey is required")
    private String projectKey;

    @NotNull(message = "groupId is required")
    private UUID groupId;
}
package uth.edu.jira.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JiraIssueRequest {

    @NotNull(message = "jiraId is required")
    private UUID jiraId;

    @NotBlank(message = "jiraIssueKey is required")
    private String jiraIssueKey;

    /** Optional: map tới task nội bộ */
    private UUID taskId;
}
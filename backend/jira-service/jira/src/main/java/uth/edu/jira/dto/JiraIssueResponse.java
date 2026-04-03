package uth.edu.jira.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class JiraIssueResponse {
    private UUID jiraIssueId;
    private UUID jiraId;
    private String jiraIssueKey;
    private UUID taskId;
    private String summary;
    private String status;
    private String issueType;
    private String assigneeEmail;
    private String priority;
    private String description;
    private LocalDateTime syncedAt;
}
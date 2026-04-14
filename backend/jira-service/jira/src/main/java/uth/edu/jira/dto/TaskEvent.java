package uth.edu.jira.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskEvent {
    private UUID taskId;
    private String title;
    private UUID assignedTo;
    private UUID requirementId;
    private String eventType;
    private String status;
    private String jiraIssueKey;
    private LocalDateTime timestamp;
}

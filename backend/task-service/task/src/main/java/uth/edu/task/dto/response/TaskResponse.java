package uth.edu.task.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uth.edu.task.model.ETaskPriority;
import uth.edu.task.model.ETaskStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private UUID taskId;
    private UUID requirementId;
    private UUID groupId;
    private String title;
    private String description;
    private ETaskStatus status;
    private ETaskPriority priority;
    private UUID assignedTo;
    private LocalDate dueDate;
    private String jiraIssueKey;
    private LocalDateTime createdAt;
    private UUID createdBy;
}

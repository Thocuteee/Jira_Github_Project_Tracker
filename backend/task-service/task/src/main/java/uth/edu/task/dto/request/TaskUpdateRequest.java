package uth.edu.task.dto.request;

import lombok.Data;
import uth.edu.task.model.ETaskPriority;
import uth.edu.task.model.ETaskStatus;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class TaskUpdateRequest {
    private String title;
    private String description;
    private ETaskPriority priority;
    private LocalDate dueDate;
    private String jiraIssueKey;
}

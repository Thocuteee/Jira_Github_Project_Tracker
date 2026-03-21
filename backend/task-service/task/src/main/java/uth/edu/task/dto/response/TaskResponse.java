package uth.edu.task.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uth.edu.task.model.TaskPriority;
import uth.edu.task.model.TaskStatus;

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
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private UUID assignedTo;
    private LocalDate dueDate;
    private LocalDateTime createdAt;
    private UUID createdBy;
}

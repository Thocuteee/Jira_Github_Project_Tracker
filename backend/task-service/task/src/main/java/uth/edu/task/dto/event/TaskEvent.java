package uth.edu.task.dto.event;

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
    private String eventType;     // Loại sự kiện: "CREATED", "ASSIGNED", "STATUS_UPDATE", "DELETED"
    private String status;        // Trạng thái hiện tại của task
    private String jiraIssueKey;

    private LocalDateTime timestamp;
}

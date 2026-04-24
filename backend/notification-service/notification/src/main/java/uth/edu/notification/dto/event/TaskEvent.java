package uth.edu.notification.dto.event;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private LocalDateTime timestamp;
}

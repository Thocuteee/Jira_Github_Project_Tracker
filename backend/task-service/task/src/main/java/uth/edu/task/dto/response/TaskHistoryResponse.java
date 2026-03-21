package uth.edu.task.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TaskHistoryResponse {
    private UUID historyId;
    private UUID taskId;
    private UUID changedBy;
    private String fieldChanged;
    private String oldValue;
    private String newValue;
    private LocalDateTime changedAt;
}

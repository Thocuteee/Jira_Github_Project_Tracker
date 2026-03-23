package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import uth.edu.task.model.ETaskStatus;

@Data
public class TaskStatusUpdateRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private ETaskStatus status;
}

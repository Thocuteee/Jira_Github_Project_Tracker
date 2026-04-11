package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TaskAssignRequest {
    @NotNull(message = "ID người nhận không được để trống")
    private UUID assignedTo;
}

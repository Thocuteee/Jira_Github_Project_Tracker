package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TaskAssignRequest {
    @NotBlank(message = "ID người nhận không được để trống")
    private String assignedTo;
}

package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uth.edu.task.model.ETaskPriority;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCreateRequest {
    @NotNull(message = "ID của Requirement không được để trống")
    private UUID requirementId;

    @NotBlank(message = "Tiêu đề Task không được để trống")
    private String title;

    private String description;

    @NotNull(message = "Mức độ ưu tiên không được để trống")
    private ETaskPriority priority;

    private UUID assignedTo;

    private LocalDate dueDate;
}

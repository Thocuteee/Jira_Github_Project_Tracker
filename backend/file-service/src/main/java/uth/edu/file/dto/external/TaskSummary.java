package uth.edu.file.dto.external;

import lombok.Data;
import java.util.UUID;

@Data
public class TaskSummary {
    private UUID taskId;
    private UUID groupId;
    private String title;
}

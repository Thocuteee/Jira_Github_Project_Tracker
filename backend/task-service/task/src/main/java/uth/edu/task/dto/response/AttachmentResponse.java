package uth.edu.task.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AttachmentResponse {
    private UUID attachmentId;
    private UUID taskId;
    private String uploadedBy;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}

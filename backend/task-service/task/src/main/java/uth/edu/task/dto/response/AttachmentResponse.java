package uth.edu.task.dto.response;

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
public class AttachmentResponse {
    private UUID attachmentId;
    private UUID taskId;
    private UUID uploadedBy;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}

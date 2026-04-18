package uth.edu.file.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uth.edu.file.model.EFileScope;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileRecordResponse {
    private String fileName;
    private String fileKey;
    private Long fileSize;
    private String fileUrl;
    private String referenceId;
    private EFileScope scope;
    private UUID uploadedBy;
    private String contentType;
    private LocalDateTime uploadedAt;
}

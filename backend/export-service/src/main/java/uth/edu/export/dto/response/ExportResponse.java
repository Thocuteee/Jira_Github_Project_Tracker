package uth.edu.export.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExportResponse {
    private UUID exportId;
    private UUID groupId;
    private String version;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private String status;
    private String generatedBy;
    private LocalDateTime createdAt;
}


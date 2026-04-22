package uth.edu.export.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String scope;
    private String contentType;
}

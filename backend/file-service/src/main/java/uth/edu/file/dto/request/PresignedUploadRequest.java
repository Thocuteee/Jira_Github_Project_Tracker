package uth.edu.file.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uth.edu.file.model.EFileScope;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUploadRequest {
    private String fileName;
    private String contentType;
    private EFileScope scope;
    private String referenceId;
}

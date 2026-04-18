package uth.edu.file.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResult {
    private PresignedUrlDto presignedUrl;
    private String fileKey;
    private String publicUrl;
}

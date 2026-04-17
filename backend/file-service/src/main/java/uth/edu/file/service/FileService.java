package uth.edu.file.service;

import org.springframework.web.multipart.MultipartFile;
import uth.edu.file.dto.FileUploadResult;
import uth.edu.file.dto.request.PresignedUploadRequest;
import uth.edu.file.dto.response.FileRecordResponse;
import uth.edu.file.model.EFileScope;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface FileService {

    FileUploadResult generateUploadUrl(PresignedUploadRequest request, UUID requestedBy, String requestedByRole);

    String generateDownloadUrl(String fileKey);

    void deleteFile(String fileKey, UUID requestedBy, String requestedByRole);

    void deleteFilesByReference(String referenceId, EFileScope scope);
    
    FileRecordResponse uploadFile(MultipartFile file, String referenceId, EFileScope scope, UUID requestedBy, String requestedByRole);

    List<FileRecordResponse> getFilesByReference(String referenceId, EFileScope scope);

    Map<String, Object> getAdminStats();
}

package uth.edu.file.service;

import uth.edu.file.dto.FileUploadResult;
import uth.edu.file.dto.request.PresignedUploadRequest;
import uth.edu.file.model.EFileScope;

import java.util.Map;
import java.util.UUID;

public interface FileService {

    FileUploadResult generateUploadUrl(PresignedUploadRequest request, UUID requestedBy, String requestedByRole);

    String generateDownloadUrl(String fileKey);

    void deleteFile(String fileKey, UUID requestedBy, String requestedByRole);

    void deleteFilesByReference(String referenceId, EFileScope scope);

    Map<String, Object> getAdminStats();
}

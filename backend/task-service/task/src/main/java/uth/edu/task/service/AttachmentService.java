package uth.edu.task.service;

import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.request.GenerateUrlRequest;
import uth.edu.task.dto.response.AttachmentResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AttachmentService {
    // Trả về Map chứa Presigned URL và FileKey
    Map<String, String> generatePresignedUrl(UUID taskId, GenerateUrlRequest request);

    AttachmentResponse saveAttachment(UUID taskId, AttachmentRequest request);

    List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId);

    AttachmentResponse updateAttachment(UUID attachmentId, AttachmentRequest request);

    void deleteAttachment(UUID taskId, UUID attachmentId);
}

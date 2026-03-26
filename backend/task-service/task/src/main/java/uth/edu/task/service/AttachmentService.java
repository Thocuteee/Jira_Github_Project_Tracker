package uth.edu.task.service;

import uth.edu.task.dto.request.AttachmentCreateRequest;
import uth.edu.task.dto.request.GenerateUrlRequest;
import uth.edu.task.dto.response.AttachmentResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AttachmentService {
    // Trả về Map chứa Presigned URL và FileKey
    Map<String, String> generatePresignedUrl(UUID taskId, GenerateUrlRequest request);

    AttachmentResponse saveAttachment(UUID taskId, AttachmentCreateRequest request);

    List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId);

    void deleteAttachment(UUID attachmentId);
}

package uth.edu.task.service;

import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface AttachmentService {
    AttachmentResponse uploadAttachment(UUID taskId, MultipartFile file);

    List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId);

    AttachmentResponse updateAttachment(UUID taskId, UUID attachmentId, AttachmentRequest request);

    void deleteAttachment(UUID taskId, UUID attachmentId);
}

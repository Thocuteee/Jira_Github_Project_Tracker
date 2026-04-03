package uth.edu.task.service;

import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;

import java.util.List;
import java.util.UUID;

public interface AttachmentService {

    AttachmentResponse addAttachment(UUID taskId, AttachmentRequest request);

    List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId);

    AttachmentResponse updateAttachment(UUID attachmentId, AttachmentRequest request);

    void deleteAttachment(UUID attachmentId);
}

package uth.edu.task.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import uth.edu.task.client.FileServiceClient;
import uth.edu.task.dto.response.file.PresignedUrlResponse;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.request.GenerateUrlRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.mapper.AttachmentMapper;
import uth.edu.task.model.Attachment;
import uth.edu.task.model.Task;
import uth.edu.task.repository.AttachmentRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.AttachmentService;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final TaskRepository taskRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileServiceClient fileServiceClient;


    private final AttachmentMapper attachmentMapper;

    @Override
    public Map<String, String> generatePresignedUrl(UUID taskId, GenerateUrlRequest request) {
        PresignedUrlResponse fileResponse = fileServiceClient.getUploadUrl(
                request.getFileName(),
                request.getContentType(),
                "TASK",
                taskId.toString()
        );

        Map<String, String> response = new HashMap<>();
        response.put("presignedUrl", fileResponse.getUploadUrl());
        response.put("fileKey", fileResponse.getFileKey());
        response.put("fileUrl", fileResponse.getFileUrl());

        return response;
    }

    @Override
    @Transactional
    public AttachmentResponse saveAttachment(UUID taskId, AttachmentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));
        Attachment attachment = attachmentMapper.toEntity(request);
        attachment.setTask(task);
        attachment.setUploadedBy(UserContextHolder.getUserId());
        attachment.setUploadedAt(LocalDateTime.now());

        Attachment saved = attachmentRepository.save(attachment);

        return attachmentMapper.toResponse(saved);
    }

    @Override
    public List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));

        List<Attachment> attachments = attachmentRepository.findByTask_TaskId(task.getTaskId());


        return attachments.stream()
                .map(attachmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AttachmentResponse updateAttachment(UUID taskId, UUID attachmentId, AttachmentRequest request) {
        Attachment existing = attachmentRepository.findByAttachmentIdAndTask_TaskId(attachmentId, taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm, hoặc file không thuộc về công việc này!"));

        String currentUserId = UserContextHolder.getUserId().toString();
        if (!existing.getUploadedBy().toString().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền sửa attachment này!");
        }
        attachmentMapper.updateEntityFromRequest(request, existing);
        return attachmentMapper.toResponse(attachmentRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteAttachment(UUID taskId, UUID attachmentId) {
        Attachment existing = attachmentRepository.findByAttachmentIdAndTask_TaskId(attachmentId, taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm, hoặc file không thuộc về công việc này!"));

        String currentUserId = UserContextHolder.getUserId().toString();
        String role = UserContextHolder.getUserRole();
        boolean owner = currentUserId != null && existing.getUploadedBy().toString().equals(currentUserId);
        boolean leader = "TEAM_LEADER".equals(role);
        if (!owner && !leader) {
            throw new RuntimeException("Bạn không có quyền xóa attachment này!");
        }

        // Gọi File Service để xóa file vật lý trên R2
        fileServiceClient.deleteFile(existing.getFileKey());

        attachmentRepository.delete(existing);
    }
}

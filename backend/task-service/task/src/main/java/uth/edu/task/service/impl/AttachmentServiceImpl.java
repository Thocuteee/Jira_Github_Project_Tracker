package uth.edu.task.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uth.edu.task.client.FileServiceClient;
import uth.edu.task.dto.response.file.FileRecordResponse;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.mapper.AttachmentMapper;
import uth.edu.task.model.Attachment;
import uth.edu.task.model.Task;
import uth.edu.task.repository.AttachmentRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.AttachmentService;

import java.time.LocalDateTime;
import java.util.List;
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
    @Transactional
    public AttachmentResponse uploadAttachment(UUID taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File đính kèm không được để trống!");
        }

        FileRecordResponse fileRecord = fileServiceClient.uploadFile(file, taskId.toString(), "TASK");
        if (fileRecord == null || fileRecord.getFileUrl() == null || fileRecord.getFileUrl().isBlank()) {
            throw new RuntimeException("file-service không trả về fileUrl hợp lệ.");
        }

        Attachment attachment = Attachment.builder()
                .task(task)
                .uploadedBy(UserContextHolder.getUserId())
                .fileName(fileRecord.getFileName() != null && !fileRecord.getFileName().isBlank()
                        ? fileRecord.getFileName()
                        : file.getOriginalFilename())
                .fileKey(fileRecord.getFileKey())
                .fileUrl(fileRecord.getFileUrl())
                .uploadedAt(LocalDateTime.now())
                .build();

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

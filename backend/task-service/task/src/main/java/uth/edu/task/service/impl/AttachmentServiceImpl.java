package uth.edu.task.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.mapper.AttachmentMapper;
import uth.edu.task.model.Attachment;
import uth.edu.task.model.Task;
import uth.edu.task.repository.AttachmentRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.AttachmentService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final AttachmentMapper attachmentMapper;

    @Override
    @Transactional
    public AttachmentResponse addAttachment(UUID taskId, AttachmentRequest request) {
        String uploadedBy = UserContextHolder.getUserId();
        if (uploadedBy == null) {
            throw new RuntimeException("Thiếu header X-User-Id");
        }
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));
        Attachment entity = attachmentMapper.toEntity(request);
        entity.setTask(task);
        entity.setUploadedBy(uploadedBy);
        return attachmentMapper.toResponse(attachmentRepository.save(entity));
    }

    @Override
    public List<AttachmentResponse> getAttachmentsByTaskId(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Không tìm thấy Task!");
        }
        return attachmentRepository.findByTask_TaskId(taskId).stream()
                .map(attachmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AttachmentResponse updateAttachment(UUID attachmentId, AttachmentRequest request) {
        Attachment existing = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy attachment!"));
        String currentUserId = UserContextHolder.getUserId();
        if (currentUserId == null || !existing.getUploadedBy().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền sửa attachment này!");
        }
        attachmentMapper.updateEntityFromRequest(request, existing);
        return attachmentMapper.toResponse(attachmentRepository.save(existing));
    }

    @Override
    @Transactional
    public void deleteAttachment(UUID attachmentId) {
        Attachment existing = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy attachment!"));
        String currentUserId = UserContextHolder.getUserId();
        String role = UserContextHolder.getUserRole();
        boolean owner = currentUserId != null && existing.getUploadedBy().equals(currentUserId);
        boolean leader = "TEAM_LEADER".equals(role);
        if (!owner && !leader) {
            throw new RuntimeException("Bạn không có quyền xóa attachment này!");
        }
        attachmentRepository.delete(existing);
    }
}

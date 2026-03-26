package uth.edu.task.service.impl;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;
import uth.edu.task.mapper.TaskCommentMapper;
import uth.edu.task.model.Task;
import uth.edu.task.model.TaskComment;
import uth.edu.task.repository.TaskCommentRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.TaskCommentService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskCommentServiceImpl implements TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentMapper taskCommentMapper;

    @Override
    public TaskCommentResponse addComment(UUID taskId, TaskCommentRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task để bình luận!"));

        TaskComment comment = taskCommentMapper.toEntity(request);
        comment.setTask(task);
        comment.setUserId(currentUserId);

        TaskComment savedComment = taskCommentRepository.save(comment);
        return taskCommentMapper.toResponse(savedComment);
    }

    @Override
    public List<TaskCommentResponse> getAllCommentsByTaskId(UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Không tìm thấy Task!");
        }

        List<TaskComment> comments = taskCommentRepository.findByTask_TaskIdOrderByCreatedAtDesc(taskId);

        return comments.stream()
                .map(taskCommentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TaskCommentResponse updateComment(UUID commentId, TaskCommentRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();

        TaskComment existingComment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận!"));

        // Chỉ người tạo ra bình luận mới được sửa
        if (!existingComment.getUserId().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa bình luận của người khác!");
        }

        taskCommentMapper.updateEntityFromRequest(request, existingComment);
        TaskComment updatedComment = taskCommentRepository.save(existingComment);

        return taskCommentMapper.toResponse(updatedComment);
    }

    @Override
    public void deleteComment(UUID commentId) {
        UUID currentUserId = UserContextHolder.getUserId();
        String role = UserContextHolder.getUserRole();

        TaskComment existingComment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận!"));

        // Người tạo hoặc Team Leader mới được xóa
        boolean isOwner = existingComment.getUserId().equals(currentUserId);
        boolean isLeader = "TEAM_LEADER".equals(role);

        if (!isOwner && !isLeader) {
            throw new RuntimeException("Bạn không có quyền xóa bình luận này!");
        }

        taskCommentRepository.delete(existingComment);
    }

}

package uth.edu.task.service.impl;


import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import uth.edu.task.client.GroupClient;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.response.external.GroupMemberResponse;
import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;
import uth.edu.task.mapper.TaskCommentMapper;
import uth.edu.task.model.Task;
import uth.edu.task.model.TaskComment;
import uth.edu.task.repository.TaskCommentRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.TaskCommentService;

@Service
@RequiredArgsConstructor
public class TaskCommentServiceImpl implements TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentMapper taskCommentMapper;
    private final GroupClient groupClient;

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
    public List<TaskCommentResponse> getCommentsByTaskIds(List<UUID> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<UUID> distinct = taskIds.stream().distinct().toList();
        List<Task> tasks = taskRepository.findAllById(distinct);
        if (tasks.isEmpty()) {
            return Collections.emptyList();
        }
        UUID groupId = tasks.get(0).getGroupId();
        if (!tasks.stream().allMatch(t -> groupId.equals(t.getGroupId()))) {
            throw new RuntimeException("Không thể tải comment cho task thuộc nhiều nhóm.");
        }
        UUID currentUserId = UserContextHolder.getUserId();
        if (!isMemberOfGroup(groupId, currentUserId) && !isAdmin() && !isLecturer()) {
            throw new RuntimeException("Bạn không có quyền xem comment của các task này!");
        }
        List<TaskComment> comments = taskCommentRepository.findByTask_TaskIdInOrderByTaskAndCreated(distinct);
        return comments.stream()
                .map(taskCommentMapper::toResponse)
                .collect(Collectors.toList());
    }

    private String getUserRoleString(UUID groupId, UUID userId) {
        try {
            List<GroupMemberResponse> members = groupClient.getGroupMembers(groupId);
            if (members == null) {
                return "NONE";
            }
            return members.stream()
                    .filter(m -> m.getUserId().equals(userId))
                    .map(GroupMemberResponse::getRoleInGroup)
                    .findFirst()
                    .orElse("NONE");
        } catch (Exception e) {
            return "NONE";
        }
    }

    private boolean isMemberOfGroup(UUID groupId, UUID userId) {
        String role = getUserRoleString(groupId, userId);
        return !"NONE".equalsIgnoreCase(role);
    }

    private boolean isLeaderInGroup(UUID groupId, UUID userId) {
        return "LEADER".equalsIgnoreCase(getUserRoleString(groupId, userId));
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isLecturer() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LECTURER"));
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

        TaskComment existingComment = taskCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận!"));

        UUID groupId = existingComment.getTask().getGroupId();
        boolean isOwner = existingComment.getUserId().equals(currentUserId);
        boolean isLeader = isLeaderInGroup(groupId, currentUserId);
        boolean isAdmin = isAdmin();

        if (!isOwner && !isLeader && !isAdmin) {
            throw new RuntimeException("Bạn không có quyền xóa bình luận này!");
        }

        taskCommentRepository.delete(existingComment);
    }

}

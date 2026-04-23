package uth.edu.task.service;

import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;

import java.util.List;
import java.util.UUID;

public interface TaskCommentService {

    TaskCommentResponse addComment(UUID taskId, TaskCommentRequest request);

    List<TaskCommentResponse> getAllCommentsByTaskId(UUID taskId);

    /**
     * Lấy comment của nhiều task trong một truy vấn (phục vụ export / báo cáo).
     */
    List<TaskCommentResponse> getCommentsByTaskIds(List<UUID> taskIds);

    TaskCommentResponse updateComment(UUID commentId, TaskCommentRequest request);

    void deleteComment(UUID commentId);
}

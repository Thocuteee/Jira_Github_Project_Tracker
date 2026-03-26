package uth.edu.task.service;

import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;

import java.util.List;
import java.util.UUID;

public interface TaskCommentService {

    TaskCommentResponse addComment(UUID taskId, TaskCommentRequest request);

    List<TaskCommentResponse> getCommentsByTaskId(UUID taskId);

    TaskCommentResponse updateComment(UUID commentId, TaskCommentRequest request);

    void deleteComment(UUID commentId);
}

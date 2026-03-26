package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;
import uth.edu.task.service.TaskCommentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService taskCommentService;


    // Tạo một comment
    // /api/tasks/{taskId}/comments
    @PostMapping("/{taskId}/comments")
    public ResponseEntity<TaskCommentResponse> addComment(@PathVariable UUID taskId,
                                                          @Valid @RequestBody TaskCommentRequest request) {
        TaskCommentResponse response = taskCommentService.addComment(taskId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // Lấy toàn comment của một Task
    // /api/tasks/{taskId}/comments
    @GetMapping("/{taskId}/comments")
    public ResponseEntity<List<TaskCommentResponse>> getAllCommentsByTaskId(@PathVariable UUID taskId){

        List<TaskCommentResponse> responses = taskCommentService.getAllCommentsByTaskId(taskId);

        return ResponseEntity.ok(responses);
    }


    // Sửa nội dung một comment
    // /api/tasks/comments/{commentId}
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<TaskCommentResponse> updateComment(@PathVariable UUID commentId,
                                                             @Valid @RequestBody TaskCommentRequest request) {
        TaskCommentResponse response = taskCommentService.updateComment(commentId, request);

        return ResponseEntity.ok(response);
    }


    // Xoá một comment
    // /api/tasks/comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        taskCommentService.deleteComment(commentId);

        return ResponseEntity.noContent().build();
    }

}

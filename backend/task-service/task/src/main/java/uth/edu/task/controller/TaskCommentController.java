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

    @PostMapping("/{taskId}/comments")
    public ResponseEntity<TaskCommentResponse> addComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody TaskCommentRequest request) {
        return new ResponseEntity<>(taskCommentService.addComment(taskId, request), HttpStatus.CREATED);
    }

    @GetMapping("/{taskId}/comments")
    public ResponseEntity<List<TaskCommentResponse>> listComments(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskCommentService.getCommentsByTaskId(taskId));
    }

    @PatchMapping("/{taskId}/comments/{commentId}")
    public ResponseEntity<TaskCommentResponse> updateComment(
            @PathVariable UUID taskId,
            @PathVariable UUID commentId,
            @Valid @RequestBody TaskCommentRequest request) {
        return ResponseEntity.ok(taskCommentService.updateComment(commentId, request));
    }

    @DeleteMapping("/{taskId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID taskId,
            @PathVariable UUID commentId) {
        taskCommentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}

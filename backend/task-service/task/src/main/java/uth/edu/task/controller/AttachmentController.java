package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.AttachmentCreateRequest;
import uth.edu.task.dto.request.GenerateUrlRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.service.AttachmentService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    // Sinh link upload file
    // /api/tasks/{taskId}/attachments/presigned-url
    @PostMapping("/{taskId}/attachments/presigned-url")
    public ResponseEntity<Map<String, String>> generatePresignedUrl(@PathVariable UUID taskId,
                                                                    @Valid @RequestBody GenerateUrlRequest request) {
        Map<String, String> response = attachmentService.generatePresignedUrl(taskId, request);

        return ResponseEntity.ok(response);
    }


    // Tạo một Attachment
    // /api/tasks/{taskId}/attachments
    @PostMapping("/{taskId}/attachments")
    public ResponseEntity<AttachmentResponse> saveAttachmentMetadata(@PathVariable UUID taskId,
                                                                     @Valid @RequestBody AttachmentCreateRequest request) {
        AttachmentResponse response = attachmentService.saveAttachment(taskId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // Lấy toàn bộ Attachment của một Task
    // /api/tasks/{taskId}/attachments
    @GetMapping("/{taskId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getAttachmentsByTaskId(@PathVariable UUID taskId) {
        List<AttachmentResponse> responses = attachmentService.getAttachmentsByTaskId(taskId);

        return ResponseEntity.ok(responses);
    }


    // Xoá một Attachment
    // /api/tasks/attachments/{attachmentId}
    @DeleteMapping("/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(attachmentId);

        return ResponseEntity.noContent().build();
    }

}

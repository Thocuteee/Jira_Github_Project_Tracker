package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.service.AttachmentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/{taskId}/attachments/upload")
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file) {
        AttachmentResponse response = attachmentService.uploadAttachment(taskId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    @GetMapping("/{taskId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> list(@PathVariable UUID taskId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByTaskId(taskId));
    }

    @PatchMapping("/{taskId}/attachments/{attachmentId}")
    public ResponseEntity<AttachmentResponse> update(
            @PathVariable UUID taskId,
            @PathVariable UUID attachmentId,
            @Valid @RequestBody AttachmentRequest request) {
        return ResponseEntity.ok(attachmentService.updateAttachment(taskId, attachmentId, request));
    }

    @DeleteMapping("/{taskId}/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID taskId,
            @PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(taskId, attachmentId);
        return ResponseEntity.noContent().build();
    }
}

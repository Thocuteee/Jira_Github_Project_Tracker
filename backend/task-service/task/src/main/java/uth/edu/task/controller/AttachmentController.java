package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.AttachmentRequest;
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


    @PostMapping("/{taskId}/attachments/presigned-url")
    public ResponseEntity<Map<String, String>> generatePresignedUrl(@PathVariable UUID taskId,
                                                                    @Valid @RequestBody GenerateUrlRequest request) {
        Map<String, String> response = attachmentService.generatePresignedUrl(taskId, request);

        return ResponseEntity.ok(response);
    }



    @PostMapping("/{taskId}/attachments")
    public ResponseEntity<AttachmentResponse> saveAttachmentMetadata(@PathVariable UUID taskId,
                                                                     @Valid @RequestBody AttachmentRequest request) {
        AttachmentResponse response = attachmentService.saveAttachment(taskId, request);

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
        return ResponseEntity.ok(attachmentService.updateAttachment(attachmentId, request));
    }

    @DeleteMapping("/{taskId}/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID taskId,
            @PathVariable UUID attachmentId) {
        attachmentService.deleteAttachment(taskId, attachmentId);
        return ResponseEntity.noContent().build();
    }
}

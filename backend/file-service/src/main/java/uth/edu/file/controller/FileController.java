package uth.edu.file.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.file.config.UserContextHolder;
import uth.edu.file.dto.request.PresignedUploadRequest;
import uth.edu.file.dto.response.PresignedUrlResponse;
import uth.edu.file.model.EFileScope;
import uth.edu.file.service.FileService;
import uth.edu.file.mapper.FileMapper;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final FileMapper fileMapper;

    @GetMapping("/presigned-upload")
    public ResponseEntity<PresignedUrlResponse> getUploadUrl(PresignedUploadRequest request) {

        UUID requestedBy = UserContextHolder.getUserId();
        String requestedByRole = UserContextHolder.getUserRole();

        uth.edu.file.dto.FileUploadResult result = fileService.generateUploadUrl(request, requestedBy, requestedByRole);
        return ResponseEntity.ok(fileMapper.toPresignedUrlResponse(result));
    }

    @GetMapping("/presigned-download")
    public ResponseEntity<String> getDownloadUrl(@RequestParam String fileKey) {
        return ResponseEntity.ok(fileService.generateDownloadUrl(fileKey));
    }

    @DeleteMapping("/{*fileKey}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileKey) {
        if (fileKey != null && fileKey.startsWith("/")) {
            fileKey = fileKey.substring(1);
        }

        UUID requestedBy = UserContextHolder.getUserId();
        String requestedByRole = UserContextHolder.getUserRole();

        fileService.deleteFile(fileKey, requestedBy, requestedByRole);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/reference/{referenceId}")
    public ResponseEntity<Void> deleteFilesByReference(
            @PathVariable String referenceId,
            @RequestParam EFileScope scope) {
        fileService.deleteFilesByReference(referenceId, scope);
        return ResponseEntity.noContent().build();
    }
}

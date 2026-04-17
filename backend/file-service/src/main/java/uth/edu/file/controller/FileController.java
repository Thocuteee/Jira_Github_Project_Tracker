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
import uth.edu.file.dto.response.FileRecordResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;
    private final FileMapper fileMapper;

    @PostMapping("/presigned-upload")
    public ResponseEntity<PresignedUrlResponse> getUploadUrl(@RequestBody PresignedUploadRequest request) {

        UUID requestedBy = UserContextHolder.getUserId();
        String requestedByRole = UserContextHolder.getUserRole();

        uth.edu.file.dto.FileUploadResult result = fileService.generateUploadUrl(request, requestedBy, requestedByRole);
        return ResponseEntity.ok(fileMapper.toPresignedUrlResponse(result));
    }

    @PostMapping("/upload")
    public ResponseEntity<FileRecordResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("referenceId") String referenceId,
            @RequestParam("scope") EFileScope scope) {

        UUID requestedBy = UserContextHolder.getUserId();
        String requestedByRole = UserContextHolder.getUserRole();

        return ResponseEntity.ok(fileService.uploadFile(file, referenceId, scope, requestedBy, requestedByRole));
    }

    @GetMapping("/reference/{referenceId}")
    public ResponseEntity<List<FileRecordResponse>> getFilesByReference(
            @PathVariable String referenceId,
            @RequestParam EFileScope scope) {
        return ResponseEntity.ok(fileService.getFilesByReference(referenceId, scope));
    }

    @GetMapping("/presigned-download")
    public ResponseEntity<String> getDownloadUrl(@RequestParam String fileKey) {
        return ResponseEntity.ok(fileService.generateDownloadUrl(fileKey));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteFile(@RequestParam String fileKey) {
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

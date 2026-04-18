package uth.edu.file.service.impl;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uth.edu.file.client.GroupClient;
import uth.edu.file.client.TaskClient;
import uth.edu.file.dto.external.GroupMemberDto;
import uth.edu.file.dto.external.TaskSummary;
import uth.edu.file.dto.FileUploadResult;
import uth.edu.file.dto.request.PresignedUploadRequest;
import uth.edu.file.dto.PresignedUrlDto;
import uth.edu.file.dto.response.FileRecordResponse;
import uth.edu.file.exception.AccessDeniedException;
import uth.edu.file.exception.ResourceNotFoundException;
import uth.edu.file.mapper.FileMapper;
import uth.edu.file.model.FileMetadata;
import uth.edu.file.model.EFileScope;
import uth.edu.file.repository.FileMetadataRepository;
import uth.edu.file.service.FileService;
import uth.edu.file.service.StorageService;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl implements FileService {

    private final StorageService storageService;
    private final FileMetadataRepository repository;
    private final TaskClient taskClient;
    private final GroupClient groupClient;
    private final FileMapper fileMapper;

    @Override
    @Transactional
    public FileUploadResult generateUploadUrl(PresignedUploadRequest request, UUID requestedBy,
            String requestedByRole) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(requestedByRole)
                || "ROLE_ADMIN".equalsIgnoreCase(requestedByRole);

        if (request.getScope() == null || request.getReferenceId() == null) {
            throw new AccessDeniedException("Thiếu tham số scope hoặc referenceId");
        }

        switch (request.getScope()) {
            case TASK -> authorizeTaskUpload(request.getReferenceId(), requestedBy, isAdmin);
            case AVATAR -> authorizeAvatarUpload(request.getReferenceId(), requestedBy, isAdmin);
            case GROUP -> authorizeGroupUpload(request.getReferenceId(), requestedBy, isAdmin);
            case EXPORT -> {
                if (!isAdmin) {
                    throw new AccessDeniedException("Chỉ Admin mới được phép!");
                }
            }
        }

        String uniqueFileName = UUID.randomUUID() + "_" + request.getFileName();
        String fileKey = String.format("%s/%s/%s", request.getScope().name().toLowerCase(), request.getReferenceId(),
                uniqueFileName);

        PresignedUrlDto presignedUrlDto = storageService.generatePresignedUploadUrl(fileKey, request.getContentType(),
                Duration.ofMinutes(15));
        String publicUrl = storageService.getPublicUrl(fileKey);

        FileMetadata metadata = fileMapper.toFileMetadata(request, fileKey, requestedBy, request.getScope());
        repository.save(metadata);

        return FileUploadResult.builder()
                .presignedUrl(presignedUrlDto)
                .fileKey(fileKey)
                .publicUrl(publicUrl)
                .build();
    }

    private void authorizeTaskUpload(String taskId, UUID requestedBy, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        try {
            UUID taskUUID = UUID.fromString(taskId);
            TaskSummary task = taskClient.getTask(taskUUID);

            if (task == null || task.getGroupId() == null) {
                throw new ResourceNotFoundException("Không tìm thấy Task: " + taskId);
            }

            List<GroupMemberDto> members = groupClient.getGroupMembers(task.getGroupId());
            boolean isLeader = members.stream()
                    .filter(m -> requestedBy.equals(m.getUserId()))
                    .anyMatch(m -> "LEADER".equalsIgnoreCase(m.getRoleInGroup()));

            if (!isLeader) {
                throw new AccessDeniedException("Chỉ Leader mới được upload File vào Task!");
            }
        } catch (IllegalArgumentException e) {
            throw new AccessDeniedException("Định dạng ID không hợp lệ: " + taskId);
        } catch (FeignException.NotFound e) {
            throw new ResourceNotFoundException("Không tìm thấy Task: " + taskId);
        } catch (FeignException e) {
            throw new AccessDeniedException("Không thể xác thực quyền. Vui lòng thử lại.");
        }
    }

    private void authorizeAvatarUpload(String referenceId, UUID requestedBy, boolean isAdmin) {
        if (isAdmin) {
            return;
        }
        if (!requestedBy.toString().equals(referenceId)) {
            throw new AccessDeniedException("Chỉ được upload avatar của chính mình!");
        }
    }

    private void authorizeGroupUpload(String groupId, UUID requestedBy, boolean isAdmin) {
        log.info("User {} uploading to group {}, permissions opened.", requestedBy, groupId);
    }

    @Override
    public FileRecordResponse uploadFile(MultipartFile file, String referenceId, EFileScope scope, UUID requestedBy, String requestedByRole) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(requestedByRole) || "ROLE_ADMIN".equalsIgnoreCase(requestedByRole);

        if (scope == null || referenceId == null) {
            throw new AccessDeniedException("Thiếu tham số scope hoặc referenceId");
        }

        switch (scope) {
            case TASK -> authorizeTaskUpload(referenceId, requestedBy, isAdmin);
            case AVATAR -> authorizeAvatarUpload(referenceId, requestedBy, isAdmin);
            case GROUP -> authorizeGroupUpload(referenceId, requestedBy, isAdmin);
            case EXPORT -> {
                if (!isAdmin) {
                    throw new AccessDeniedException("Chỉ Admin mới được phép!");
                }
            }
        }

        String originalFileName = file.getOriginalFilename();
        String safeFileName = (originalFileName != null ? originalFileName : "unknown")
                .replaceAll("[^a-zA-Z0-9.-]", "_"); // Thay the cac ky tu la bang dau gach duoi
        String uniqueFileName = UUID.randomUUID() + "_" + safeFileName;
        String fileKey = String.format("%s/%s/%s", scope.name().toLowerCase(), referenceId, uniqueFileName);

        try {
            storageService.uploadFile(fileKey, file.getBytes(), file.getContentType());

            FileMetadata metadata = new FileMetadata();
            metadata.setFileKey(fileKey);
            metadata.setOriginalName(originalFileName != null ? originalFileName : "unknown");
            metadata.setReferenceId(referenceId);
            metadata.setScope(scope);
            metadata.setUploadedBy(requestedBy);
            metadata.setFileSize(file.getSize());
            metadata.setContentType(file.getContentType());

            FileMetadata saved = repository.save(metadata);
            log.info("Proxy upload successful: fileKey={}, uploadedBy={}", fileKey, requestedBy);

            FileRecordResponse resp = fileMapper.toFileRecordResponse(saved);
            if (resp != null) {
                resp.setFileUrl(storageService.getPublicUrl(fileKey));
            }
            return resp;
        } catch (Exception e) {
            log.error("Error in proxy upload: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi upload file: " + e.getMessage());
        }
    }

    @Override
    public List<FileRecordResponse> getFilesByReference(String referenceId, EFileScope scope) {
        log.info("Fetching files for referenceId: {}, scope: {}", referenceId, scope);
        try {
            List<FileMetadata> metadataList = repository.findAllByReferenceIdAndScope(referenceId, scope);
            return metadataList.stream().map(m -> {
                FileRecordResponse resp = fileMapper.toFileRecordResponse(m);
                if (resp != null) {
                    resp.setFileUrl(storageService.getPublicUrl(m.getFileKey()));
                }
                return resp;
            }).filter(Objects::nonNull).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching files from database: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    @Override
    public String generateDownloadUrl(String fileKey) {
        return storageService.generatePresignedDownloadUrl(fileKey, Duration.ofMinutes(30));
    }

    @Override
    @Transactional
    public void deleteFile(String fileKey, UUID requestedBy, String requestedByRole) {
        FileMetadata metadata = repository.findById(fileKey)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy File: " + fileKey));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(requestedByRole)
                || "ROLE_ADMIN".equalsIgnoreCase(requestedByRole);
        boolean isOwner = requestedBy != null && requestedBy.equals(metadata.getUploadedBy());

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Bạn không có quyền xóa file này!");
        }

        storageService.deleteFile(fileKey);
        repository.delete(metadata);
    }

    @Override
    @Transactional
    public void deleteFilesByReference(String referenceId, EFileScope scope) {
        List<FileMetadata> files = repository.findAllByReferenceIdAndScope(referenceId, scope);
        for (FileMetadata file : files) {
            storageService.deleteFile(file.getFileKey());
        }
        repository.deleteAllByReferenceIdAndScope(referenceId, scope);
    }

    @Override
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalFiles = repository.count();
        Long totalBytes = repository.sumTotalFileSize();
        if (totalBytes == null)
            totalBytes = 0L;

        stats.put("totalFiles", totalFiles);
        stats.put("totalCapacity", formatSize(totalBytes));

        List<Object[]> usageByScopeRaw = repository.sumFileSizeGroupByScope();
        Map<String, String> usageByScope = new HashMap<>();
        for (Object[] row : usageByScopeRaw) {
            EFileScope scope = (EFileScope) row[0];
            Long size = (Long) row[1];
            usageByScope.put(scope.name(), formatSize(size));
        }
        stats.put("usageByScope", usageByScope);

        return stats;
    }

    private String formatSize(long bytes) {
        if (bytes < 1024)
            return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}

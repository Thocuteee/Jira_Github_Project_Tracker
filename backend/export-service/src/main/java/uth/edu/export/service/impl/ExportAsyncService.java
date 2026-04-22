package uth.edu.export.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import feign.FeignException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uth.edu.export.client.AuthClient;
import uth.edu.export.client.FileServiceClient;
import uth.edu.export.client.GroupClient;
import uth.edu.export.client.RequirementClient;
import uth.edu.export.dto.ExportNotification;
import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.dto.response.FileRecordResponse;
import uth.edu.export.dto.response.GroupInfoResponse;
import uth.edu.export.dto.response.UserInfoResponse;
import uth.edu.export.model.ExportSRS;
import uth.edu.export.model.ExportStatus;
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.service.IDocumentGeneratorService;
import uth.edu.export.util.InMemoryMultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportAsyncService {

    private final ExportSRSRepository exportRepository;
    private final RequirementClient requirementClient;
    private final GroupClient groupClient;
    private final AuthClient authClient;
    private final IDocumentGeneratorService documentGeneratorService;
    private final FileServiceClient fileServiceClient;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Async
    public void generateDocumentAsync(UUID exportId, ExportDocumentRequest request) {
        log.info("Start async export for exportId={}", exportId);
        try {
            updateStatus(exportId, ExportStatus.PROCESSING, "Đang tạo tài liệu...");

            ExportSRS export = findExportWithRetry(exportId);

            UUID requestedBy = request.getRequestedBy() != null ? request.getRequestedBy() : export.getGeneratedBy();
            if (requestedBy == null) {
                throw new IllegalArgumentException("Thiếu requestedBy cho yêu cầu export.");
            }

            String requirementDataJson = maybeFilterCompletedOnly(fetchRequirementData(request), request);
            String groupName = resolveGroupNameWithFallback(request.getGroupId());
            String authorName = resolveAuthorNameWithFallback(requestedBy);
            byte[] fileData = documentGeneratorService.generateDocument(
                    requirementDataJson,
                    request.getFileType(),
                    groupName,
                    authorName);

            String normalizedFileType = request.getFileType().toUpperCase();
            String extension = normalizedFileType.toLowerCase();
            String fileName = export.getFileName();
            if (fileName == null || fileName.isBlank()) {
                fileName = String.format("SRS_%s.%s", exportId, extension);
            }
            String contentType = "PDF".equals(normalizedFileType)
                    ? "application/pdf"
                    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

            MultipartFile multipartFile = new InMemoryMultipartFile("file", fileName, contentType, fileData);

            FileRecordResponse fileRecord = fileServiceClient.uploadFile(
                    multipartFile,
                    request.getGroupId().toString(),
                    "EXPORT",
                    requestedBy.toString(),
                    "ROLE_TEAM_MEMBER");

            markCompleted(exportId, requirementDataJson, fileRecord.getFileUrl());

            rabbitTemplate.convertAndSend(
                    exchange,
                    routingKey,
                    new ExportNotification(
                            request.getGroupId(),
                            fileRecord.getFileUrl(),
                            "Tài liệu SRS đã được tạo thành công."));

            log.info("Export completed for exportId={}, fileUrl={}", exportId, fileRecord.getFileUrl());

        } catch (Exception e) {
            log.error("Failed async export exportId={}", exportId, e);
            markFailed(exportId, "Lỗi: " + e.getMessage());
        }
    }

    private String fetchRequirementData(ExportDocumentRequest request) {
        if (request.getRequirementIds() != null && !request.getRequirementIds().isEmpty()) {
            return requirementClient.getRequirementsByIds(request.getRequirementIds());
        }
        if (request.getGroupId() == null) {
            throw new IllegalArgumentException("groupId là bắt buộc.");
        }
        return requirementClient.getRequirementsByGroupId(request.getGroupId());
    }

    private String maybeFilterCompletedOnly(String requirementDataJson, ExportDocumentRequest request) throws Exception {
        if (!Boolean.TRUE.equals(request.getIncludeCompletedOnly())) {
            return requirementDataJson;
        }
        List<Map<String, Object>> rows = objectMapper.readValue(
                requirementDataJson, new TypeReference<List<Map<String, Object>>>() {});
        List<Map<String, Object>> filtered = rows.stream()
                .filter(row -> "DONE".equalsIgnoreCase(String.valueOf(row.getOrDefault("status", ""))))
                .collect(Collectors.toList());
        return objectMapper.writeValueAsString(filtered);
    }

    private String resolveGroupNameWithFallback(UUID groupId) {
        if (groupId == null) {
            return "Unknown Group";
        }
        try {
            GroupInfoResponse group = groupClient.getGroupById(groupId);
            if (group != null && group.getGroupName() != null && !group.getGroupName().isBlank()) {
                return group.getGroupName().trim();
            }
            log.warn("group-service returned empty groupName for groupId={}", groupId);
        } catch (FeignException fe) {
            log.warn("Cannot resolve groupName from group-service for groupId={} (status={}): {}",
                    groupId, fe.status(), fe.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected error while resolving groupName for groupId={}: {}", groupId, e.getMessage());
        }
        return groupId.toString();
    }

    private String resolveAuthorNameWithFallback(UUID userId) {
        if (userId == null) {
            return "System";
        }
        try {
            UserInfoResponse user = authClient.getUserById(userId);
            if (user != null && user.getName() != null && !user.getName().isBlank()) {
                return user.getName().trim();
            }
            log.warn("auth-service returned empty name for userId={}", userId);
        } catch (FeignException fe) {
            log.warn("Cannot resolve user name from auth-service for userId={} (status={}): {}",
                    userId, fe.status(), fe.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected error while resolving user name for userId={}: {}", userId, e.getMessage());
        }
        return userId.toString();
    }

    private ExportSRS findExportWithRetry(UUID exportId) throws InterruptedException {
        final int maxAttempts = 3;
        final long retryDelayMs = 200L;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            var found = exportRepository.findById(exportId);
            if (found.isPresent()) {
                return found.get();
            }
            if (attempt < maxAttempts) {
                log.warn("exportId={} chưa khả dụng ở attempt {}/{}. Retrying...", exportId, attempt, maxAttempts);
                Thread.sleep(retryDelayMs);
            }
        }
        throw new IllegalArgumentException("Không tìm thấy exportId: " + exportId);
    }

    @Transactional
    protected void updateStatus(UUID exportId, ExportStatus status, String note) {
        exportRepository.findById(exportId).ifPresent(export -> {
            export.setStatus(status);
            export.setNote(note);
            exportRepository.save(export);
        });
    }

    @Transactional
    protected void markCompleted(UUID exportId, String requirementSnapshot, String fileUrl) {
        exportRepository.findById(exportId).ifPresent(export -> {
            export.setRequirementSnapshot(requirementSnapshot);
            export.setStatus(ExportStatus.COMPLETED);
            export.setFileUrl(fileUrl);
            export.setCompletedAt(LocalDateTime.now());
            export.setNote("Tài liệu đã được tạo thành công.");
            exportRepository.save(export);
        });
    }

    @Transactional
    protected void markFailed(UUID exportId, String note) {
        exportRepository.findById(exportId).ifPresent(export -> {
            export.setStatus(ExportStatus.FAILED);
            export.setCompletedAt(LocalDateTime.now());
            export.setNote(note);
            exportRepository.save(export);
        });
    }
}

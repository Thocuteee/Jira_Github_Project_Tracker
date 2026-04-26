package uth.edu.export.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import uth.edu.export.client.TaskClient;
import uth.edu.export.context.ExportFeignContext;
import uth.edu.export.dto.ExportNotificationEvent;
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

    private static final DateTimeFormatter TASK_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ExportSRSRepository exportRepository;
    private final RequirementClient requirementClient;
    private final TaskClient taskClient;
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
    public void generateDocumentAsync(UUID exportId, ExportDocumentRequest request, String authorizationHeader) {
        log.info("Start async export for exportId={}", exportId);
        try {
            updateStatus(exportId, ExportStatus.PROCESSING, "Đang tạo tài liệu...");

            ExportSRS export = findExportWithRetry(exportId);

            UUID requestedBy = request.getRequestedBy() != null ? request.getRequestedBy() : export.getGeneratedBy();
            if (requestedBy == null) {
                throw new IllegalArgumentException("Thiếu requestedBy cho yêu cầu export.");
            }
            ExportFeignContext.setBearerToken(authorizationHeader);
            ExportFeignContext.setRequestingUserId(requestedBy);

            String requirementDataJson = maybeFilterCompletedOnly(fetchRequirementData(request), request);
            String reportType = request.getReportType();
            if (reportType == null || reportType.isBlank()) {
                reportType = "SRS";
            }
            if ("PROGRESS".equalsIgnoreCase(reportType.trim())) {
                requirementDataJson = buildProgressExportPayload(requirementDataJson, request, requestedBy);
            }

            String groupName = resolveGroupNameWithFallback(request.getGroupId());
            String authorName = resolveAuthorNameWithFallback(requestedBy);

            byte[] fileData = documentGeneratorService.generateDocument(
                    requirementDataJson,
                    request.getFileType(),
                    groupName,
                    authorName,
                    request.getCustomIntroduction(),
                    reportType);

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

            FileRecordResponse fileRecord;
            try {
                fileRecord = fileServiceClient.uploadFile(
                        multipartFile,
                        request.getGroupId().toString(),
                        "EXPORT");
            } catch (FeignException fe) {
                log.error(
                        "Upload file-service thất bại exportId={} HTTP status={} body={}",
                        exportId,
                        fe.status(),
                        fe.contentUTF8(),
                        fe);
                markFailed(
                        exportId,
                        "Upload file-service thất bại (HTTP " + fe.status() + "): " + fe.getMessage());
                return;
            }

            if (fileRecord == null || fileRecord.getFileUrl() == null || fileRecord.getFileUrl().isBlank()) {
                log.error("file-service trả về thiếu fileUrl exportId={}", exportId);
                markFailed(exportId, "file-service không trả về fileUrl hợp lệ.");
                return;
            }

            markCompleted(exportId, requirementDataJson, fileRecord.getFileUrl());

            try {
                rabbitTemplate.convertAndSend(
                        exchange,
                        routingKey,
                        new ExportNotificationEvent(
                                requestedBy,
                                fileName,
                                fileRecord.getFileUrl(),
                                "Tài liệu của bạn đã xuất thành công"));
            } catch (Exception notifyEx) {
                log.warn(
                        "Export succeeded but RabbitMQ notification failed for exportId={}: {}",
                        exportId,
                        notifyEx.getMessage());
            }

            log.info("Export completed for exportId={}, fileUrl={}", exportId, fileRecord.getFileUrl());

        } catch (Exception e) {
            log.error("Failed async export exportId={}", exportId, e);
            markFailed(exportId, "Lỗi: " + e.getMessage());
        } finally {
            ExportFeignContext.clear();
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
                .filter(row -> isCompletedRequirementStatus(String.valueOf(row.getOrDefault("status", ""))))
                .collect(Collectors.toList());
        return objectMapper.writeValueAsString(filtered);
    }

    private boolean isCompletedRequirementStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim();
        return "DONE".equalsIgnoreCase(normalized) || "COMPLETED".equalsIgnoreCase(normalized);
    }

    private String buildProgressExportPayload(
            String requirementDataJson, ExportDocumentRequest request, UUID requestedBy) throws Exception {
        List<Map<String, Object>> rows =
                objectMapper.readValue(requirementDataJson, new TypeReference<List<Map<String, Object>>>() {});
        List<Map<String, Object>> mutableRows = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            mutableRows.add(new LinkedHashMap<>(row));
        }

        List<UUID> requirementIds = mutableRows.stream()
                .map(this::extractRequirementUuid)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        boolean includeTaskDetails = Boolean.TRUE.equals(request.getIncludeTasks());
        boolean includeCommentDetails = Boolean.TRUE.equals(request.getIncludeComments());

        List<Map<String, Object>> taskRows = Collections.emptyList();
        if (!requirementIds.isEmpty()) {
            try {
                String tasksJson = taskClient.getTasksByRequirementIds(requirementIds);
                taskRows = objectMapper.readValue(tasksJson, new TypeReference<List<Map<String, Object>>>() {});
            } catch (FeignException fe) {
                log.warn("Task service batch failed (status={}): {}", fe.status(), fe.getMessage());
            } catch (Exception e) {
                log.warn("Could not load tasks for progress export: {}", e.getMessage());
            }
        }

        Map<UUID, List<Map<String, Object>>> tasksByRequirement = taskRows.stream()
                .filter(t -> extractTaskRequirementUuid(t) != null)
                .collect(Collectors.groupingBy(this::extractTaskRequirementUuid));

        Map<UUID, List<Map<String, Object>>> commentsByTaskId = new HashMap<>();
        if (includeCommentDetails && !taskRows.isEmpty()) {
            List<UUID> taskIds = taskRows.stream()
                    .map(this::extractTaskUuid)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();
            if (!taskIds.isEmpty()) {
                try {
                    String commentsJson = taskClient.getCommentsByTaskIds(taskIds);
                    List<Map<String, Object>> commentRows =
                            objectMapper.readValue(commentsJson, new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> c : commentRows) {
                        UUID tid = extractCommentTaskUuid(c);
                        if (tid == null) {
                            continue;
                        }
                        commentsByTaskId.computeIfAbsent(tid, k -> new ArrayList<>()).add(normalizeCommentRow(c));
                    }
                } catch (FeignException fe) {
                    log.warn("Task comments batch failed (status={}): {}", fe.status(), fe.getMessage());
                } catch (Exception e) {
                    log.warn("Could not load task comments for progress export: {}", e.getMessage());
                }
            }
        }

        Map<UUID, String> userNameCache = new HashMap<>();
        int totalTasks = 0;
        for (Map<String, Object> req : mutableRows) {
            UUID rid = extractRequirementUuid(req);
            List<Map<String, Object>> forReq =
                    rid != null ? tasksByRequirement.getOrDefault(rid, List.of()) : List.of();
            totalTasks += forReq.size();

            List<Map<String, Object>> nestedTasks = new ArrayList<>();
            if (includeTaskDetails) {
                for (Map<String, Object> rawTask : forReq) {
                    Map<String, Object> taskView = normalizeTaskRow(rawTask, userNameCache);
                    UUID taskId = extractTaskUuid(rawTask);
                    if (includeCommentDetails && taskId != null) {
                        taskView.put(
                                "comments",
                                commentsByTaskId.getOrDefault(taskId, List.of()));
                    } else {
                        taskView.put("comments", List.of());
                    }
                    nestedTasks.add(taskView);
                }
            }
            req.put("tasks", nestedTasks);
        }

        int totalReq = mutableRows.size();
        long completedReq = mutableRows.stream()
                .map(r -> String.valueOf(r.getOrDefault("status", "")))
                .filter(this::isCompletedRequirementStatus)
                .count();
        int completionPercent = totalReq == 0 ? 0 : (int) Math.round((completedReq * 100.0) / totalReq);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRequirements", totalReq);
        summary.put("completedRequirements", (int) completedReq);
        summary.put("completionPercent", completionPercent);
        summary.put("totalTasks", totalTasks);
        summary.put("includeTaskDetails", includeTaskDetails);
        summary.put("includeCommentDetails", includeCommentDetails);

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("summary", summary);
        root.put("requirements", mutableRows);
        return objectMapper.writeValueAsString(root);
    }

    private Map<String, Object> normalizeCommentRow(Map<String, Object> c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("content", String.valueOf(c.getOrDefault("content", "")));
        Object createdAt = c.get("createdAt");
        m.put("createdAt", createdAt != null ? String.valueOf(createdAt) : "");
        UUID uid = extractUuid(c.get("userId"));
        m.put("author", uid != null ? resolveAuthorNameWithFallback(uid) : "");
        return m;
    }

    private Map<String, Object> normalizeTaskRow(Map<String, Object> t, Map<UUID, String> userNameCache) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", String.valueOf(t.getOrDefault("title", "")));
        m.put("status", String.valueOf(t.getOrDefault("status", "")));
        UUID assignee = extractUuid(t.get("assignedTo"));
        if (assignee != null) {
            m.put("assignee", userNameCache.computeIfAbsent(assignee, this::resolveAuthorNameWithFallback));
        } else {
            m.put("assignee", "—");
        }
        m.put("dueDate", formatTaskDueDate(t.get("dueDate")));
        return m;
    }

    private String formatTaskDueDate(Object dueDate) {
        if (dueDate == null) {
            return "—";
        }
        try {
            if (dueDate instanceof String s && !s.isBlank()) {
                return LocalDate.parse(s).format(TASK_DATE_FMT);
            }
            if (dueDate instanceof List<?> list && list.size() >= 3) {
                int y = ((Number) list.get(0)).intValue();
                int mo = ((Number) list.get(1)).intValue();
                int d = ((Number) list.get(2)).intValue();
                return LocalDate.of(y, mo, d).format(TASK_DATE_FMT);
            }
        } catch (Exception ignored) {
            return String.valueOf(dueDate);
        }
        return String.valueOf(dueDate);
    }

    private UUID extractRequirementUuid(Map<String, Object> row) {
        UUID fromReq = extractUuid(row.get("requirementId"));
        if (fromReq != null) {
            return fromReq;
        }
        return extractUuid(row.get("id"));
    }

    private UUID extractTaskRequirementUuid(Map<String, Object> task) {
        return extractUuid(task.get("requirementId"));
    }

    private UUID extractTaskUuid(Map<String, Object> task) {
        return extractUuid(task.get("taskId"));
    }

    private UUID extractCommentTaskUuid(Map<String, Object> comment) {
        return extractUuid(comment.get("taskId"));
    }

    private UUID extractUuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID u) {
            return u;
        }
        try {
            return UUID.fromString(String.valueOf(value));
        } catch (Exception e) {
            return null;
        }
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
            export.setStatus(ExportStatus.DONE);
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

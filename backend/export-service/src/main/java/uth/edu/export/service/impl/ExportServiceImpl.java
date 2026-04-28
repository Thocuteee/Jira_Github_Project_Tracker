package uth.edu.export.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.text.Normalizer;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import lombok.RequiredArgsConstructor;
import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.model.ExportSRS;
import uth.edu.export.model.ExportStatus;
import uth.edu.export.model.FileType;     
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.service.IExportService;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements IExportService {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern DISALLOWED_CHARS = Pattern.compile("[^a-zA-Z0-9_-]");
    private static final Pattern DUPLICATE_SEPARATORS = Pattern.compile("[_-]{2,}");
    private static final int MAX_BASE_NAME_LENGTH = 120;

    private final ExportSRSRepository exportRepository;
    // Gọi ExportAsyncService async: tạo file, upload qua file-service, cập nhật DB; trả exportId ngay cho client.
    private final ExportAsyncService exportAsyncService; 

    @Override
    public List<ExportResponse> getExportsByGroupId(UUID groupId) {
        return exportRepository.findByGroupIdOrderByCreatedAtDesc(groupId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ExportResponse toResponse(ExportSRS export) {
        String normalizedStatus = null;
        if (export.getStatus() != null) {
            normalizedStatus = export.getStatus().name();
            if (ExportStatus.DONE.name().equals(normalizedStatus)) {
                normalizedStatus = ExportStatus.COMPLETED.name();
            }
        }

        return ExportResponse.builder()
                .exportId(export.getExportId())
                .groupId(export.getGroupId())
                .version(export.getVersion())
                .fileName(export.getFileName())
                .fileUrl(export.getFileUrl())
                .fileType(export.getFileType() != null ? export.getFileType().name() : null)
                .status(normalizedStatus)
                .generatedBy(export.getGeneratedBy() != null ? export.getGeneratedBy().toString() : null)
                .createdAt(export.getCreatedAt())
                .completedAt(export.getCompletedAt())
                .build();
    }
    
    @Override
    @Transactional
    public String processExportRequest(ExportDocumentRequest request, String authorizationHeader) {
        if (request.getGroupId() == null) {
            throw new IllegalArgumentException("groupId là bắt buộc.");
        }
        if (request.getFileType() == null || request.getFileType().isBlank()) {
            throw new IllegalArgumentException("fileType là bắt buộc.");
        }

        FileType fileType = FileType.valueOf(request.getFileType().toUpperCase());
        String extension = fileType == FileType.PDF ? ".pdf" : ".docx";

        ExportSRS newExport = ExportSRS.builder()
                .groupId(request.getGroupId())
                .fileType(fileType)
                .fileName(buildFileName(request.getDocumentName(), extension))
                .status(ExportStatus.PENDING)
                .generatedBy(request.getRequestedBy())
                .createdAt(LocalDateTime.now())
                .note("Yêu cầu xuất tài liệu đã được tạo.")
                .build();

        ExportSRS savedExport = exportRepository.save(newExport);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                exportAsyncService.generateDocumentAsync(savedExport.getExportId(), request, authorizationHeader);
            }
        });

        return savedExport.getExportId().toString();
    }

    private String buildFileName(String requestedName, String extension) {
        String sanitized = sanitizeDocumentName(requestedName);
        if (sanitized.isBlank()) {
            return "SRS_" + UUID.randomUUID() + extension;
        }
        return sanitized + extension;
    }

    private String sanitizeDocumentName(String input) {
        if (input == null) {
            return "";
        }
        String normalized = Normalizer.normalize(input.trim(), Normalizer.Form.NFD);
        String withoutMarks = DIACRITICS.matcher(normalized).replaceAll("");
        String collapsedWhitespace = withoutMarks.replaceAll("\\s+", "_");
        String stripped = DISALLOWED_CHARS.matcher(collapsedWhitespace).replaceAll("");
        String deduplicated = DUPLICATE_SEPARATORS.matcher(stripped).replaceAll("_");
        String cleaned = deduplicated.replaceAll("^[_-]+|[_-]+$", "");
        if (cleaned.length() > MAX_BASE_NAME_LENGTH) {
            cleaned = cleaned.substring(0, MAX_BASE_NAME_LENGTH).replaceAll("^[_-]+|[_-]+$", "");
        }
        return cleaned.toLowerCase(Locale.ROOT);
    }
}
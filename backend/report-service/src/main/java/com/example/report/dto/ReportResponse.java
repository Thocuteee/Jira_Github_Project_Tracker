package com.example.report.dto;

import com.example.report.model.ReportType;
import com.example.report.model.GeneratedBy;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReportResponse {
    private UUID reportId;
    private UUID groupId;
    private UUID userId;
    private ReportType reportType;
    private GeneratedBy generatedBy;
    private LocalDateTime createdAt;
}
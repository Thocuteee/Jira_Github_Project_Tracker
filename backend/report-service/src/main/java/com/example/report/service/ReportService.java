package com.example.report.service;

import com.example.report.dto.ReportRequest;
import com.example.report.dto.ReportResponse;
import com.example.report.model.Report;
import com.example.report.model.ReportType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReportService {
    ReportResponse createReport(ReportRequest request);
    ReportResponse getReportById(UUID reportId);
    List<ReportResponse> getAllReports();
    List<ReportResponse> getReportsByUserId(UUID userId);
    List<ReportResponse> getReportsByGroupId(UUID groupId);
    List<ReportResponse> getReportsByType(ReportType reportType);
    List<ReportResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    ReportResponse updateReport(UUID reportId, ReportRequest request);
    void deleteReport(UUID reportId);
    long countReportsByGroupId(UUID groupId);
}
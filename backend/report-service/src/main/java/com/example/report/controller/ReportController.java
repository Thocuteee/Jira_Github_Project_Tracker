package com.example.report.controller;

import com.example.report.dto.ReportRequest;
import com.example.report.dto.ReportResponse;
import com.example.report.model.ReportType;
import com.example.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {
    
    private final ReportService reportService;
    
    @PostMapping
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        ReportResponse response = reportService.createReport(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportResponse> getReportById(@PathVariable UUID reportId) {
        ReportResponse response = reportService.getReportById(reportId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        List<ReportResponse> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReportResponse>> getReportsByUserId(@PathVariable UUID userId) {
        List<ReportResponse> reports = reportService.getReportsByUserId(userId);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ReportResponse>> getReportsByGroupId(@PathVariable UUID groupId) {
        List<ReportResponse> reports = reportService.getReportsByGroupId(groupId);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/type/{reportType}")
    public ResponseEntity<List<ReportResponse>> getReportsByType(@PathVariable ReportType reportType) {
        List<ReportResponse> reports = reportService.getReportsByType(reportType);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/date-range")
    public ResponseEntity<List<ReportResponse>> getReportsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<ReportResponse> reports = reportService.getReportsByDateRange(startDate, endDate);
        return ResponseEntity.ok(reports);
    }
    
    @PutMapping("/{reportId}")
    public ResponseEntity<ReportResponse> updateReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportRequest request) {
        ReportResponse response = reportService.updateReport(reportId, request);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID reportId) {
        reportService.deleteReport(reportId);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/group/{groupId}/count")
    public ResponseEntity<Long> countReportsByGroupId(@PathVariable UUID groupId) {
        long count = reportService.countReportsByGroupId(groupId);
        return ResponseEntity.ok(count);
    }
}
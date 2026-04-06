package uth.edu.report.controller;

import uth.edu.report.dto.ReportRequestDTO;
import uth.edu.report.dto.ReportResponseDTO;
import uth.edu.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // POST /api/v1/reports
    @PostMapping
    public ResponseEntity<ReportResponseDTO> createReport(
            @Valid @RequestBody ReportRequestDTO requestDTO) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(reportService.createReport(requestDTO));
    }

    // GET /api/v1/reports
    @GetMapping
    public ResponseEntity<List<ReportResponseDTO>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    // GET /api/v1/reports/{reportId}
    @GetMapping("/{reportId}")
    public ResponseEntity<ReportResponseDTO> getReportById(
            @PathVariable UUID reportId) {
        return ResponseEntity.ok(reportService.getReportById(reportId));
    }

    // GET /api/v1/reports/group/{groupId}
    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<ReportResponseDTO>> getReportsByGroup(
            @PathVariable UUID groupId) {
        return ResponseEntity.ok(reportService.getReportsByGroup(groupId));
    }

    // GET /api/v1/reports/generated-by/{userId}
    @GetMapping("/generated-by/{userId}")
    public ResponseEntity<List<ReportResponseDTO>> getReportsByGeneratedBy(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(reportService.getReportsByGeneratedBy(userId));
    }

    // GET /api/v1/reports/type/{reportType}
    @GetMapping("/type/{reportType}")
    public ResponseEntity<List<ReportResponseDTO>> getReportsByType(
            @PathVariable String reportType) {
        return ResponseEntity.ok(reportService.getReportsByType(reportType));
    }

    // PUT /api/v1/reports/{reportId}
    @PutMapping("/{reportId}")
    public ResponseEntity<ReportResponseDTO> updateReport(
            @PathVariable UUID reportId,
            @Valid @RequestBody ReportRequestDTO requestDTO) {
        return ResponseEntity.ok(reportService.updateReport(reportId, requestDTO));
    }

    // DELETE /api/v1/reports/{reportId}
    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> deleteReport(@PathVariable UUID reportId) {
        reportService.deleteReport(reportId);
        return ResponseEntity.noContent().build();
    }
}
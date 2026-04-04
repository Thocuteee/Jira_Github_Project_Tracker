package uth.edu.report.service;

import uth.edu.report.dto.ReportRequestDTO;
import uth.edu.report.dto.ReportResponseDTO;

import java.util.List;
import java.util.UUID;

public interface ReportService {

    ReportResponseDTO createReport(ReportRequestDTO requestDTO);

    ReportResponseDTO getReportById(UUID reportId);

    List<ReportResponseDTO> getAllReports();

    List<ReportResponseDTO> getReportsByGroup(UUID groupId);

    List<ReportResponseDTO> getReportsByGeneratedBy(UUID userId);

    List<ReportResponseDTO> getReportsByType(String reportType);

    ReportResponseDTO updateReport(UUID reportId, ReportRequestDTO requestDTO);

    void deleteReport(UUID reportId);
}
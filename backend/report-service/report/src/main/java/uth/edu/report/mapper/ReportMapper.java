package uth.edu.report.mapper;

import org.springframework.stereotype.Component;

import uth.edu.report.dto.*;
import uth.edu.report.model.Report;

@Component
public class ReportMapper {

    public Report toEntity(ReportRequestDTO dto) {
        return Report.builder()
                .groupId(dto.getGroupId())
                .reportIdUser(dto.getReportIdUser())
                .title(dto.getTitle())
                .reportType(dto.getReportType())
                .generatedBy(dto.getGeneratedBy())
                .build();
    }

    public ReportResponseDTO toDTO(Report report) {
        return ReportResponseDTO.builder()
                .reportId(report.getReportId())
                .groupId(report.getGroupId())
                .reportIdUser(report.getReportIdUser())
                .title(report.getTitle())
                .reportType(report.getReportType())
                .generatedBy(report.getGeneratedBy())
                .createdAt(report.getCreatedAt())
                .build();
    }
}
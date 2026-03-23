package com.example.report.service;

import com.example.report.dto.ReportRequest;
import com.example.report.dto.ReportResponse;
import com.example.report.exception.ReportNotFoundException;
import com.example.report.model.Report;
import com.example.report.model.ReportType;
import com.example.report.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReportServiceImpl implements ReportService {
    private final UserRepository userRepository;
private final GroupRepository groupRepository;
    
    private final ReportRepository reportRepository;
    
    @Override
    public ReportResponse createReport(ReportRequest request) {
        User user = userRepository.findById(request.getUserId())
    .orElseThrow(() -> new RuntimeException("User not found"));

Group group = groupRepository.findById(request.getGroupId())
    .orElseThrow(() -> new RuntimeException("Group not found"));

Report report = new Report();
report.setUser(user);
report.setGroup(group);
        report.setReportType(request.getReportType());
        report.setGeneratedBy(request.getGeneratedBy());
        
        Report savedReport = reportRepository.save(report);
        return mapToResponse(savedReport);
    }
    
    @Override
    public ReportResponse getReportById(UUID reportId) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ReportNotFoundException("Report not found with id: " + reportId));
        return mapToResponse(report);
    }
    
    @Override
    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ReportResponse> getReportsByUserId(UUID userId) {
        return reportRepository.findByUserId(userId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ReportResponse> getReportsByGroupId(UUID groupId) {
        return reportRepository.findByGroupId(groupId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ReportResponse> getReportsByType(ReportType reportType) {
        return reportRepository.findByReportType(reportType).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<ReportResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return reportRepository.findReportsByDateRange(startDate, endDate).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public ReportResponse updateReport(UUID reportId, ReportRequest request) {
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new ReportNotFoundException("Report not found with id: " + reportId));
        
       User user = userRepository.findById(request.getUserId())
    .orElseThrow(() -> new RuntimeException("User not found"));

Group group = groupRepository.findById(request.getGroupId())
    .orElseThrow(() -> new RuntimeException("Group not found"));

report.setUser(user);
report.setGroup(group);
        report.setReportType(request.getReportType());
        report.setGeneratedBy(request.getGeneratedBy());
        
        Report updatedReport = reportRepository.save(report);
        return mapToResponse(updatedReport);
    }
    
    @Override
    public void deleteReport(UUID reportId) {
        if (!reportRepository.existsById(reportId)) {
            throw new ReportNotFoundException("Report not found with id: " + reportId);
        }
        reportRepository.deleteById(reportId);
    }
    
    @Override
    public long countReportsByGroupId(UUID groupId) {
        return reportRepository.countByGroupId(groupId);
    }
    
    private ReportResponse mapToResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setReportId(report.getReportId());
        response.setUserId(report.getUser().getUserId());
response.setGroupId(report.getGroup().getGroupId());
        response.setReportType(report.getReportType());
        response.setGeneratedBy(report.getGeneratedBy());
        response.setCreatedAt(report.getCreatedAt());
        return response;
    }
}
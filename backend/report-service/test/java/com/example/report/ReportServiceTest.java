package com.example.report;

import com.example.report.dto.ReportRequest;
import com.example.report.dto.ReportResponse;
import com.example.report.model.GeneratedBy;
import com.example.report.model.ReportType;
import com.example.report.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class ReportServiceTest {
    
    @Autowired
    private ReportService reportService;
    
    @Test
    public void testCreateAndGetReport() {
        // Create report
        ReportRequest request = new ReportRequest();
        request.setGroupId(UUID.randomUUID());
        request.setUserId(UUID.randomUUID());
        request.setReportType(ReportType.SALES_REPORT);
        request.setGeneratedBy(GeneratedBy.USER);
        
        ReportResponse created = reportService.createReport(request);
        
        assertThat(created.getReportId()).isNotNull();
        assertThat(created.getReportType()).isEqualTo(ReportType.SALES_REPORT);
        
        // Get report by ID
        ReportResponse retrieved = reportService.getReportById(created.getReportId());
        assertThat(retrieved.getReportId()).isEqualTo(created.getReportId());
    }
    
    @Test
    public void testGetAllReports() {
        List<ReportResponse> reports = reportService.getAllReports();
        assertThat(reports).isNotNull();
    }
}
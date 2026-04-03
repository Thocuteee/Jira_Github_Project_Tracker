package uth.edu.report.repository;

import uth.edu.report.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    List<Report> findByGroupId(UUID groupId);

    List<Report> findByGeneratedBy(UUID generatedBy);

    List<Report> findByReportType(String reportType);

    List<Report> findByReportIdUser(UUID reportIdUser);
}
package com.example.report.repository;

import com.example.report.model.Report;
import com.example.report.model.ReportType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {
    
    List<Report> findByUser_UserId(UUID userId);
    List<Report> findByGroup_GroupId(UUID groupId);
    
    List<Report> findByReportType(ReportType reportType);
    
    @Query("SELECT r FROM Report r WHERE r.createdAt BETWEEN :startDate AND :endDate")
    List<Report> findReportsByDateRange(@Param("startDate") LocalDateTime startDate, 
                                        @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT r FROM Report r WHERE r.userId = :userId AND r.reportType = :reportType")
    List<Report> findByUserIdAndReportType(@Param("userId") UUID userId, 
                                           @Param("reportType") ReportType reportType);
    
    long countByGroupId(UUID groupId);
}
package com.example.report.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "report_id", columnDefinition = "UUID")
    private UUID reportId;
    @ManyToOne
@JoinColumn(name = "user_id", nullable = false)
private User user;

@ManyToOne
@JoinColumn(name = "group_id", nullable = false)
private Group group;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "generated_by", nullable = false)
    private GeneratedBy generatedBy;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
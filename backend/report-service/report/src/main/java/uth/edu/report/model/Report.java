package uth.edu.report.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "report_id", updatable = false, nullable = false)
    private UUID reportId;

    /** FK -> Group (Group Service) */
    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    /** FK -> User (Auth Service) */
    @Column(name = "report_id_user", nullable = false)
    private UUID reportIdUser;

    @Column(name = "title", nullable = false)
    private String title;

    /** e.g. WEEKLY, SPRINT, FINAL */
    @Column(name = "report_type", nullable = false)
    private String reportType;

    /** FK -> User who generated this report */
    @Column(name = "generated_by", nullable = false)
    private UUID generatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
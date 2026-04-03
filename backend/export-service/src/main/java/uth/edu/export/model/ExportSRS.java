package uth.edu.export.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "export_srs")
@Getter 
@Setter
@NoArgsConstructor 
@AllArgsConstructor
@Builder
public class ExportSRS {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID exportId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    private String version;
    private String fileName;
    private String fileUrl;
    
    @Enumerated(EnumType.STRING)
    private FileType fileType;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String requirementSnapshot;
    
    @Enumerated(EnumType.STRING)
    private ExportStatus status;
    
    @Column(name = "generated_by")
    private UUID generatedBy;
    
    @Column(columnDefinition = "TEXT")
    private String note;
    
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
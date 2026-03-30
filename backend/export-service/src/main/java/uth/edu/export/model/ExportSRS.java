package uth.edu.export.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "export_srs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExportSRS {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID exportId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "user_id")
    private UUID userId;

    private String version;
    private String fileName;
    private String fileUrl;
    private String fileType;
    
    @Column(columnDefinition = "TEXT")
    private String requirementSnapshot;
    
    private String status;
    private String generatedBy;
    private String note;
    
    private LocalDateTime createdAt = LocalDateTime.now();
}




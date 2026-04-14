package uth.edu.file.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {

    @Id
    @Column(name = "file_key")
    private String fileKey;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "file_size")
    private Long fileSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false)
    private EFileScope scope;

    @Column(name = "reference_id")
    private String referenceId; // UserId, TaskId, or ExportId

    @Column(name = "uploaded_by")
    private java.util.UUID uploadedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

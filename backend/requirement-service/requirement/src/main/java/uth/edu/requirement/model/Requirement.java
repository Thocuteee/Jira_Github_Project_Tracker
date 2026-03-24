package uth.edu.requirement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "requirements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Requirement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "requirement_id", nullable = false, updatable = false)
    private UUID requirementId;

    // FK thật tới bảng requirement_groups
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "group_id",
            referencedColumnName = "group_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_requirement_group")
    )
    private RequirementGroup group;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // logical FK tới user service, nếu cùng DB có thể map @ManyToOne
    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private ERequirementPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ERequirementStatus status;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = ERequirementStatus.NEW;
        }
        if (this.priority == null) {
            this.priority = ERequirementPriority.MEDIUM;
        }
    }
}

package uth.edu.github.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "integrations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Integration {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "integration_id")
    private UUID integrationId;

    // logical FK sang group-service
    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "github_token", nullable = true)
    private String githubToken;

    @Column(name = "github_repo")
    private String githubRepo;

    @Column(name = "jira_project_key")
    private String jiraProjectKey;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
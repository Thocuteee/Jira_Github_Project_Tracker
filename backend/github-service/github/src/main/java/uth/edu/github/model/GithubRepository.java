package uth.edu.github.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_repositories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GithubRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "repo_id")
    private UUID repoId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Column(name = "repo_url")
    private String repoUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
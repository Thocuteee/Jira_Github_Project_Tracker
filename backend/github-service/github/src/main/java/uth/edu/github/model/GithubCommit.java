package uth.edu.github.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "github_commits")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GithubCommit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "commit_id")
    private UUID commitId;

    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repo_id", nullable = false)
    private GithubRepository repo;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "commit_hash", nullable = false, unique = true)
    private String commitHash;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "commit_file")
    private String commitFile;

    @Column(name = "committed_at")
    private LocalDateTime committedAt;

    @PrePersist
    public void prePersist() {
        if (this.committedAt == null) {
            this.committedAt = LocalDateTime.now();
        }
    }

    public String getUrl() {
        if (this.repo != null && this.repo.getRepoUrl() != null) {
            return this.repo.getRepoUrl() + "/commit/" + this.commitHash;
        }
        return "https://github.com/commit/" + this.commitHash;
    }
}
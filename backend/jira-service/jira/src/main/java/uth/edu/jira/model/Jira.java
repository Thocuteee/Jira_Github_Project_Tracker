package uth.edu.jira.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "jiras")
@Getter 
@Setter 
@NoArgsConstructor 
@AllArgsConstructor 
@Builder
public class Jira {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "jira_id", updatable = false, nullable = false)
    private UUID jiraId;

    /** FK -> User (Auth Service) - người cấu hình */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "jira_url", nullable = false)
    private String jiraUrl;

    @Column(name = "project_key", nullable = false)
    private String projectKey;

    /** FK -> Group (Group Service) */
    @Column(name = "group_id", nullable = false)
    private UUID groupId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "jira", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JiraIssue> issues = new ArrayList<>();
}
package uth.edu.jira.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "jira_issues")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JiraIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "jira_issue_id", updatable = false, nullable = false)
    private UUID jiraIssueId;

    /** FK -> Jira (config) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jira_id", nullable = false)
    private Jira jira;

    /** Key từ Jira Cloud, vd: SWP391-12 */
    @Column(name = "jira_issue_key", nullable = false, unique = true)
    private String jiraIssueKey;

    /** FK -> Task (Task Service) - map issue Jira sang task nội bộ */
    @Column(name = "task_id")
    private UUID taskId;

    /** Dữ liệu cache từ Jira API */
    @Column(name = "summary")
    private String summary;

    @Column(name = "status")
    private String status;

    @Column(name = "issue_type")
    private String issueType;

    @Column(name = "assignee_email")
    private String assigneeEmail;

    @Column(name = "priority")
    private String priority;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "synced_at")
    private java.time.LocalDateTime syncedAt;
}
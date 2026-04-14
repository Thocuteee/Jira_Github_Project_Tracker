package uth.edu.group.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID memberId;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(nullable = false)
    private UUID userId;

    private String roleInGroup;

    //github username
    @Column(name = "github_username")
    private String githubUsername;
    //jira account
    @Column(name = "jira_account_id")
    private String jiraAccountId;


    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
}
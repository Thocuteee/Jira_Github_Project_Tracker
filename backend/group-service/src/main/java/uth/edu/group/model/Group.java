package uth.edu.group.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "groups")
@Getter 
@Setter
@NoArgsConstructor 
@AllArgsConstructor
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID groupId;

    @Column(nullable = false)
    private String groupName;

    private UUID leaderId;

    private String jiraProjectKey;
    private String githubRepoUrl;

    private String workspaceId;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GroupStatus status = GroupStatus.ACTIVE;

    @Column(nullable = false)
    private Integer maxMembers = 8;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private UUID createdBy;
}
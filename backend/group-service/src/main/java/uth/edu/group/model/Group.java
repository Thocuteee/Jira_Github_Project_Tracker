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
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID groupId;

    @Column(nullable = false)
    private String groupName;

    private UUID leaderId;

    private String jiraProjectKey;
    private String githubRepoUrl;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private UUID createdBy;
}
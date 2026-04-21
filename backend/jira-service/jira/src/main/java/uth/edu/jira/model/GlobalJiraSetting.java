package uth.edu.jira.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "global_jira_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalJiraSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String jiraUrl;

    @Column(nullable = false)
    private String jiraUsername;

    @Column(nullable = false, length = 500)
    private String jiraApiToken;
}

package uth.edu.github.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "global_settings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class GlobalSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "jira_url")
    private String jiraUrl;

    @Column(name = "jira_email")
    private String jiraEmail;

    @Column(name = "jira_token")
    private String jiraToken;

    @Column(name = "github_portal_token")
    private String githubPortalToken;
}

package uth.edu.jira.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalJiraSettingRequest {
    private String jiraUrl;
    private String jiraUsername;
    private String jiraApiToken;
}

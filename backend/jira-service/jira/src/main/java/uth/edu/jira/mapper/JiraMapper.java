package uth.edu.jira.mapper;

import uth.edu.jira.dto.*;
import uth.edu.jira.model.*;
import org.springframework.stereotype.Component;

@Component
public class JiraMapper {

    public Jira toEntity(JiraRequest dto) {
        return Jira.builder()
                .userId(dto.getUserId())
                .jiraUrl(dto.getJiraUrl())
                .projectKey(dto.getProjectKey())
                .groupId(dto.getGroupId())
                .build();
    }

    public JiraResponse toDTO(Jira jira) {
        return JiraResponse.builder()
                .jiraId(jira.getJiraId())
                .userId(jira.getUserId())
                .jiraUrl(jira.getJiraUrl())
                .projectKey(jira.getProjectKey())
                .groupId(jira.getGroupId())
                .createdAt(jira.getCreatedAt())
                .build();
    }

    public JiraIssueResponse toIssueDTO(JiraIssue issue) {
        return JiraIssueResponse.builder()
                .jiraIssueId(issue.getJiraIssueId())
                .jiraId(issue.getJira() != null ? issue.getJira().getJiraId() : null)
                .jiraIssueKey(issue.getJiraIssueKey())
                .taskId(issue.getTaskId())
                .summary(issue.getSummary())
                .status(issue.getStatus())
                .issueType(issue.getIssueType())
                .assigneeEmail(issue.getAssigneeEmail())
                .priority(issue.getPriority())
                .description(issue.getDescription())
                .syncedAt(issue.getSyncedAt())
                .build();
    }

    public JiraIssue toIssueEntity(JiraIssueRequest dto) {
        return JiraIssue.builder()
                .jiraIssueKey(dto.getJiraIssueKey())
                .taskId(dto.getTaskId())
                .summary(dto.getSummary())
                .status(dto.getStatus())
                .issueType(dto.getIssueType())
                .assigneeEmail(dto.getAssigneeEmail())
                .priority(dto.getPriority())
                .description(dto.getDescription())
                .build();
    }
}
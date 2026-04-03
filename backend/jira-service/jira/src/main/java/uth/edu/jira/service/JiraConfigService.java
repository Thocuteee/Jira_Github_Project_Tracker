package uth.edu.jira.service;

import uth.edu.jira.dto.JiraRequest;
import uth.edu.jira.dto.JiraResponse;
import java.util.List;
import java.util.UUID;

public interface JiraConfigService {

    JiraResponse createJiraConfig(JiraRequest dto);

    JiraResponse getJiraConfigById(UUID jiraId);

    List<JiraResponse> getJiraConfigsByGroup(UUID groupId);

    List<JiraResponse> getJiraConfigsByUser(UUID userId);

    JiraResponse updateJiraConfig(UUID jiraId, JiraRequest dto);

    void deleteJiraConfig(UUID jiraId);
}
package uth.edu.jira.service;

import uth.edu.jira.dto.*;
import java.util.List;
import java.util.UUID;

public interface JiraIssueService {

    /** Sync toàn bộ issues từ Jira Cloud về DB theo jiraId */
    List<JiraIssueResponse> syncIssuesFromJira(UUID jiraId);

    /** Tạo thủ công (nếu cần) */
    JiraIssueResponse createJiraIssue(JiraIssueRequest dto);

    JiraIssueResponse getJiraIssueById(UUID jiraIssueId);

    JiraIssueResponse getJiraIssueByKey(String jiraIssueKey);

    List<JiraIssueResponse> getIssuesByJiraId(UUID jiraId);

    List<JiraIssueResponse> getIssuesByTaskId(UUID taskId);

    List<JiraIssueResponse> getIssuesByStatus(String status);

    List<JiraIssueResponse> getIssuesByJiraIdAndStatus(UUID jiraId, String status);

    List<JiraIssueResponse> getIssuesByAssigneeEmail(String email);

    /** Link / unlink issue với task nội bộ */
    JiraIssueResponse linkToTask(UUID jiraIssueId, UUID taskId);

    JiraIssueResponse unlinkFromTask(UUID jiraIssueId);

    void deleteJiraIssue(UUID jiraIssueId);
}
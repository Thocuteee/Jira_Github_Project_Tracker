package uth.edu.jira.repository;

import uth.edu.jira.model.JiraIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface JiraIssueRepository extends JpaRepository<JiraIssue, UUID> {
    List<JiraIssue> findByJira_JiraId(UUID jiraId);
    List<JiraIssue> findByTaskId(UUID taskId);
    Optional<JiraIssue> findByJiraIssueKey(String jiraIssueKey);
    List<JiraIssue> findByStatus(String status);
    List<JiraIssue> findByJira_JiraIdAndStatus(UUID jiraId, String status);
    List<JiraIssue> findByAssigneeEmail(String assigneeEmail);
    boolean existsByJiraIssueKey(String jiraIssueKey);
}
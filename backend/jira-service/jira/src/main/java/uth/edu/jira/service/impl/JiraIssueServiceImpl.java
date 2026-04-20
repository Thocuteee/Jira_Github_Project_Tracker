package uth.edu.jira.service.impl;

import uth.edu.jira.dto.JiraIssueRequest;
import uth.edu.jira.dto.JiraIssueResponse;
import uth.edu.jira.exception.ResourceNotFoundException;
import uth.edu.jira.mapper.JiraMapper;
import uth.edu.jira.model.Jira;
import uth.edu.jira.model.JiraIssue;
import uth.edu.jira.repository.JiraIssueRepository;
import uth.edu.jira.repository.JiraRepository;
import uth.edu.jira.repository.JiraSyncActivityRepository;
import uth.edu.jira.model.JiraSyncActivity;
import uth.edu.jira.service.JiraIssueService;
import uth.edu.jira.service.JiraClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.atlassian.jira.rest.client.api.domain.Comment;
import com.atlassian.jira.rest.client.api.domain.Issue;
import com.atlassian.jira.rest.client.api.domain.SearchResult;
import com.atlassian.jira.rest.client.api.domain.Transition;
import com.atlassian.jira.rest.client.api.domain.input.IssueInput;
import com.atlassian.jira.rest.client.api.domain.input.IssueInputBuilder;
import com.atlassian.jira.rest.client.api.domain.input.TransitionInput;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@RequiredArgsConstructor
@Slf4j
public class JiraIssueServiceImpl implements JiraIssueService {

    private final JiraIssueRepository jiraIssueRepository;
    private final JiraRepository jiraRepository;
    private final JiraMapper jiraMapper;
    private final JiraClientProvider jiraClientProvider;
    private final RabbitTemplate rabbitTemplate;
    private final JiraSyncActivityRepository activityRepository;

    private void logActivity(String message, String status, UUID groupId) {
        JiraSyncActivity activity = JiraSyncActivity.builder()
                .message(message)
                .status(status)
                .groupId(groupId)
                .build();
        activityRepository.save(activity);
    }

    @Override
    public List<JiraIssueResponse> syncIssuesFromJira(UUID jiraId) {
        log.info("Syncing issues from Jira for jiraId: {}", jiraId);
        Jira jira = findJiraOrThrow(jiraId);
        return Collections.emptyList();
    }

    @Override
    @Transactional
    public JiraIssueResponse createJiraIssue(JiraIssueRequest dto) {
        log.info("Creating JiraIssue: {}", dto.getJiraIssueKey());
        JiraIssue issue = jiraMapper.toIssueEntity(dto);
        issue.setSyncedAt(LocalDateTime.now());
        return jiraMapper.toIssueDTO(jiraIssueRepository.save(issue));
    }

    @Override
    public JiraIssueResponse getJiraIssueById(UUID jiraIssueId) {
        return jiraMapper.toIssueDTO(findIssueOrThrow(jiraIssueId));
    }

    @Override
    public JiraIssueResponse getJiraIssueByKey(String jiraIssueKey) {
        JiraIssue issue = jiraIssueRepository.findByJiraIssueKey(jiraIssueKey)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found key: " + jiraIssueKey));
        return jiraMapper.toIssueDTO(issue);
    }

    @Override
    public List<JiraIssueResponse> getIssuesByJiraId(UUID jiraId) {
        return jiraIssueRepository.findByJira_JiraId(jiraId).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    public List<JiraIssueResponse> getIssuesByTaskId(UUID taskId) {
        return jiraIssueRepository.findByTaskId(taskId).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    public List<JiraIssueResponse> getIssuesByStatus(String status) {
        return jiraIssueRepository.findByStatus(status).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    public List<JiraIssueResponse> getIssuesByJiraIdAndStatus(UUID jiraId, String status) {
        return jiraIssueRepository.findByJira_JiraIdAndStatus(jiraId, status).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    public List<JiraIssueResponse> getIssuesByAssigneeEmail(String email) {
        return jiraIssueRepository.findByAssigneeEmail(email).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public JiraIssueResponse linkToTask(UUID jiraIssueId, UUID taskId) {
        log.info("Linking jiraIssueId={} to taskId={}", jiraIssueId, taskId);
        JiraIssue issue = findIssueOrThrow(jiraIssueId);
        issue.setTaskId(taskId);
        return jiraMapper.toIssueDTO(jiraIssueRepository.save(issue));
    }

    @Override
    @Transactional
    public JiraIssueResponse unlinkFromTask(UUID jiraIssueId) {
        log.info("Unlinking jiraIssueId={} from task", jiraIssueId);
        JiraIssue issue = findIssueOrThrow(jiraIssueId);
        issue.setTaskId(null);
        return jiraMapper.toIssueDTO(jiraIssueRepository.save(issue));
    }

    @Override
    @Transactional
    public void deleteJiraIssue(UUID jiraIssueId) {
        log.info("Deleting jiraIssueId={}", jiraIssueId);
        jiraIssueRepository.delete(findIssueOrThrow(jiraIssueId));
    }

    private Jira findJiraOrThrow(UUID jiraId) {
        return jiraRepository.findById(jiraId)
                .orElseThrow(() -> new ResourceNotFoundException("Jira config not found: " + jiraId));
    }

    private JiraIssue findIssueOrThrow(UUID id) {
        return jiraIssueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JiraIssue not found: " + id));
    }

    @Override
    public void addCommentToIssue(String issueKey, String commentBody) {
        try {
            jiraClientProvider.getClient().getIssueClient().addComment(
                jiraClientProvider.getClient().getIssueClient().getIssue(issueKey).claim().getCommentsUri(), Comment.valueOf(commentBody)
            ).claim();
        } catch(Exception e) {
            throw new RuntimeException("Lỗi gọi Jira API: " + e.getMessage());
        }
    }

    @Override
    public void transitionIssueStatus(String issueKey, String statusName) {
        try {
            log.info("Attempting to transition Jira issue {} to status {}", issueKey, statusName);
            Issue issue = jiraClientProvider.getClient().getIssueClient().getIssue(issueKey).claim();
            Iterable<Transition> transitions = jiraClientProvider.getClient().getIssueClient()
                .getTransitions(issue.getTransitionsUri()).claim();
            
            String targetStatusName = statusName;
            if ("TODO".equalsIgnoreCase(statusName)) targetStatusName = "To Do";
            if ("IN_PROGRESS".equalsIgnoreCase(statusName)) targetStatusName = "In Progress";
            if ("DONE".equalsIgnoreCase(statusName)) targetStatusName = "Done";

            Integer transitionId = null;
            for (Transition t : transitions) {
                if (t.getName().equalsIgnoreCase(targetStatusName)) {
                    transitionId = t.getId();
                    break;
                }
            }
            
            if (transitionId == null) {
                for (Transition t : transitions) {
                    String tName = t.getName().toLowerCase();
                    String sName = targetStatusName.toLowerCase();
                    if (tName.contains(sName) || (sName.equals("done") && tName.contains("hoàn thành"))) {
                        transitionId = t.getId();
                        break;
                    }
                }
            }

            if (transitionId != null) {
                jiraClientProvider.getClient().getIssueClient().transition(issue.getTransitionsUri(), new TransitionInput(transitionId)).claim();
                log.info("Successfully transitioned Jira issue {} using transitionId {}", issueKey, transitionId);
            }
        } catch (Exception e) {
            log.error("Failed to transition Jira issue {}: {}", issueKey, e.getMessage());
        }
    }

    @Override
    public void deleteIssueOnJira(String issueKey) {
        try {
            log.info("Deleting issue {} on Jira Cloud", issueKey);
            jiraClientProvider.getClient().getIssueClient().deleteIssue(issueKey, true).claim();
            logActivity("Deleted Jira issue: " + issueKey, "SUCCESS", null);
        } catch (Exception e) {
            log.error("Failed to delete Jira issue {}: {}", issueKey, e.getMessage());
            logActivity("Failed to delete Jira issue " + issueKey + ": " + e.getMessage(), "ERROR", null);
        }
    }

    @Override
    public String createIssueOnJira(String projectKey, String summary, String description, String issueType, String parentKey, UUID groupId) {
        try {
            logActivity("Creating " + issueType + " on Jira for project " + projectKey, "INFO", groupId);
            
            Iterable<com.atlassian.jira.rest.client.api.domain.IssueType> issueTypes = 
                jiraClientProvider.getClient().getProjectClient().getProject(projectKey).claim().getIssueTypes();
            
            com.atlassian.jira.rest.client.api.domain.IssueType targetType = StreamSupport.stream(issueTypes.spliterator(), false)
                .filter(t -> t.getName().equalsIgnoreCase(issueType != null ? issueType : "Task"))
                .findFirst()
                .orElse(issueTypes.iterator().next());

            IssueInputBuilder builder = new IssueInputBuilder(projectKey, targetType.getId());
            builder.setSummary(summary);
            builder.setDescription(description);

            IssueInput input = builder.build();
            com.atlassian.jira.rest.client.api.domain.BasicIssue created = jiraClientProvider.getClient().getIssueClient().createIssue(input).claim();
            log.info("Created Jira issue: {}", created.getKey());
            logActivity("Successfully created Jira issue: " + created.getKey(), "SUCCESS", groupId);
            return created.getKey();
        } catch (Exception e) {
            log.error("Failed to create Jira issue: {}", e.getMessage());
            logActivity("Failed to create Jira issue: " + e.getMessage(), "ERROR", groupId);
            return null;
        }
    }

    @Override
    public void syncProjectFromJira(String projectKey, UUID groupId) {
        try {
            log.info("Starting sync for project {} to group {}", projectKey, groupId);
            logActivity("Starting synchronization for Jira project: " + projectKey, "INFO", groupId);
            
            // Tinh chỉnh JQL: Thêm dấu ngoặc kép cho project key để tránh lỗi cú pháp
            String jql = "project = \"" + projectKey + "\" ORDER BY created ASC";
            log.info("Searching Jira issues with JQL: {}", jql);
            logActivity("Searching Jira with JQL: " + jql, "INFO", groupId);
            
            SearchResult results = jiraClientProvider.getClient().getSearchClient().searchJql(jql).claim();
            
            int count = 0;
            for (Issue issue : results.getIssues()) {
                java.util.Map<String, Object> event = new java.util.HashMap<>();
                event.put("jiraIssueKey", issue.getKey());
                event.put("groupId", groupId.toString());
                event.put("title", issue.getSummary());
                event.put("description", issue.getDescription() != null ? issue.getDescription() : "");
                event.put("issueType", issue.getIssueType().getName());
                event.put("status", issue.getStatus().getName());
                
                rabbitTemplate.convertAndSend("jira.sync.exchange", "jira.import", event);
                count++;
            }
            logActivity("Broadcasted " + count + " issues for synchronization from Jira project: " + projectKey, "SUCCESS", groupId);
        } catch (Throwable t) {
            String errorMsg = t.getMessage() != null ? t.getMessage() : t.toString();
            log.error("CRITICAL error during sync from Jira: {}", errorMsg, t);
            logActivity("Failed to sync project from Jira: " + errorMsg, "ERROR", groupId);
        }
    }
}
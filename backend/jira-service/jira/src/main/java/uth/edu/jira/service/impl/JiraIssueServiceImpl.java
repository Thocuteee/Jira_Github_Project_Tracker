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
import com.atlassian.jira.rest.client.api.domain.Transition;
import com.atlassian.jira.rest.client.api.domain.input.IssueInput;
import com.atlassian.jira.rest.client.api.domain.input.IssueInputBuilder;
import com.atlassian.jira.rest.client.api.domain.input.TransitionInput;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

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
        String trimmedMessage = message != null && message.length() > 255 ? message.substring(0, 252) + "..."
                : message;

        JiraSyncActivity activity = JiraSyncActivity.builder()
                .message(trimmedMessage)
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
                    jiraClientProvider.getClient().getIssueClient().getIssue(issueKey).claim().getCommentsUri(),
                    Comment.valueOf(commentBody)).claim();
        } catch (Exception e) {
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
            if ("TODO".equalsIgnoreCase(statusName))
                targetStatusName = "To Do";
            if ("IN_PROGRESS".equalsIgnoreCase(statusName))
                targetStatusName = "In Progress";
            if ("DONE".equalsIgnoreCase(statusName))
                targetStatusName = "Done";

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
                jiraClientProvider.getClient().getIssueClient()
                        .transition(issue.getTransitionsUri(), new TransitionInput(transitionId)).claim();
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
    public String createIssueOnJira(String projectKey, String summary, String description, String issueType,
            String parentKey, UUID groupId) {
        try {
            logActivity("Creating " + issueType + " on Jira for project " + projectKey, "INFO", groupId);

            Iterable<com.atlassian.jira.rest.client.api.domain.IssueType> issueTypes = jiraClientProvider.getClient()
                    .getProjectClient().getProject(projectKey).claim().getIssueTypes();

            com.atlassian.jira.rest.client.api.domain.IssueType targetType = StreamSupport
                    .stream(issueTypes.spliterator(), false)
                    .filter(t -> t.getName().equalsIgnoreCase(issueType != null ? issueType : "Task"))
                    .findFirst()
                    .orElse(issueTypes.iterator().next());

            IssueInputBuilder builder = new IssueInputBuilder(projectKey, targetType.getId());
            builder.setSummary(summary);
            builder.setDescription(description);

            IssueInput input = builder.build();
            com.atlassian.jira.rest.client.api.domain.BasicIssue created = jiraClientProvider.getClient()
                    .getIssueClient().createIssue(input).claim();
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

            String jql = "project = \"" + projectKey + "\" ORDER BY created ASC";
            log.info("Searching Jira issues with JQL (v3 POST): {}", jql);
            logActivity("Searching Jira API v3 with JQL: " + jql, "INFO", groupId);
            
            String baseUrl = jiraClientProvider.getBaseUrl();
            if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            String username = jiraClientProvider.getUsername();
            
            log.info("Executing sync with URL: {} and User: {}", baseUrl, username);
            logActivity("Verifying credentials: URL=" + baseUrl + ", User=" + username, "INFO", groupId);
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBasicAuth(jiraClientProvider.getUsername(), jiraClientProvider.getToken());
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Void> diagEntity = new HttpEntity<>(headers);

            // Bước chẩn đoán: Lấy danh sách dự án mà Token này thấy được
            try {
                String projectUrl = baseUrl + "/rest/api/3/project";
                ResponseEntity<List> projectResponse = restTemplate.exchange(projectUrl, HttpMethod.GET, diagEntity, List.class);
                List<Map<String, Object>> projectList = projectResponse.getBody();
                if (projectList != null) {
                    List<String> keys = projectList.stream().map(p -> (String) p.get("key")).collect(Collectors.toList());
                    log.info("Token has access to projects: {}", keys);
                    logActivity("Token has access to projects: " + keys.toString(), "INFO", groupId);
                } else {
                    logActivity("Token cannot see any projects!", "WARN", groupId);
                }
            } catch (Exception e) {
                log.error("Failed to fetch project list: {}", e.getMessage());
                logActivity("Diagnostics failed: Cannot list projects. Check Token/Permissions.", "WARN", groupId);
            }

            String searchUrl = baseUrl + "/rest/api/3/search/jql";
            // Xây dựng Body cho POST request
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("jql", jql);
            requestBody.put("maxResults", 100);
            requestBody.put("fields", Arrays.asList("summary", "description", "issuetype", "status", "priority"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(searchUrl, entity, Map.class);
            Map<String, Object> body = (Map<String, Object>) response.getBody();

            if (body == null) throw new RuntimeException("Phản hồi từ Jira API v3 bị trống.");

            List<Map<String, Object>> issues = (List<Map<String, Object>>) body.get("issues");
            if (issues == null) issues = new ArrayList<>();
            
            int count = 0;
            log.info("Found {} issues in Jira project (v3 POST) {}", issues.size(), projectKey);
            logActivity("Found " + issues.size() + " issues in Jira v3 (POST). Starting broadcast...", "INFO", groupId);

            for (Map<String, Object> issueData : issues) {
                String issueKey = (String) issueData.get("key");
                Map<String, Object> fields = (Map<String, Object>) issueData.get("fields");
                
                Map<String, Object> event = new HashMap<>();
                event.put("jiraIssueKey", issueKey);
                event.put("groupId", groupId.toString());
                event.put("title", fields.get("summary"));
                event.put("description", fields.get("description") != null ? fields.get("description").toString() : "");
                
                Map<String, Object> issueType = (Map<String, Object>) fields.get("issuetype");
                event.put("issueType", issueType != null ? issueType.get("name") : "Task");
                
                Map<String, Object> status = (Map<String, Object>) fields.get("status");
                event.put("status", status != null ? status.get("name") : "To Do");

                Map<String, Object> priority = (Map<String, Object>) fields.get("priority");
                event.put("priority", priority != null ? priority.get("name") : "Medium");
                
                rabbitTemplate.convertAndSend("jira.sync.exchange", "jira.import", event);
                count++;
            }
            logActivity("Broadcasted " + count + " issues for synchronization from Jira project: " + projectKey,
                    "SUCCESS", groupId);
        } catch (org.springframework.amqp.AmqpException ae) {
            log.error("RabbitMQ connection error during sync: {}", ae.getMessage());
            logActivity("Lỗi kết nối RabbitMQ: " + ae.getMessage(), "ERROR", groupId);
        } catch (Throwable t) {
            String errorMsg = t.getMessage() != null ? t.getMessage() : t.toString();
            log.error("CRITICAL error during sync from Jira: {}", errorMsg, t);
            logActivity("Failed to sync project from Jira: " + errorMsg, "ERROR", groupId);
        }
    }
}
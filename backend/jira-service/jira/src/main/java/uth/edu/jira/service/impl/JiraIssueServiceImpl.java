package uth.edu.jira.service.impl;

import uth.edu.jira.dto.JiraIssueRequest;
import uth.edu.jira.dto.JiraIssueResponse;
import uth.edu.jira.exception.ResourceNotFoundException;
import uth.edu.jira.mapper.JiraMapper;
import uth.edu.jira.model.Jira;
import uth.edu.jira.model.JiraIssue;
import uth.edu.jira.repository.JiraIssueRepository;
import uth.edu.jira.repository.JiraRepository;
import uth.edu.jira.service.JiraIssueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.atlassian.jira.rest.client.api.JiraRestClient;
import com.atlassian.jira.rest.client.api.domain.SearchResult;

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
    private final JiraRestClient jiraRestClient;
    private final JiraMapper jiraMapper;

    @Override
    @Transactional
    public List<JiraIssueResponse> syncIssuesFromJira(UUID jiraId) {
        Jira jiraConfig = findJiraOrThrow(jiraId);
        String jql = "project = " + jiraConfig.getProjectKey() + " ORDER BY created DESC";
        log.info("Syncing Jira issues for projectKey={}, jql={}",
                jiraConfig.getProjectKey(), jql);

        try {
            SearchResult result = jiraRestClient.getSearchClient()
                    .searchJql(jql).claim();

            List<JiraIssueResponse> synced = new ArrayList<>();

            StreamSupport.stream(result.getIssues().spliterator(), false)
                    .forEach(ghIssue -> {
                        // Skip nếu đã tồn tại — chỉ update thay vì insert mới
                        Optional<JiraIssue> existing =
                                jiraIssueRepository.findByJiraIssueKey(ghIssue.getKey());

                        JiraIssue entity = existing.orElse(
                                JiraIssue.builder()
                                        .jira(jiraConfig)
                                        .jiraIssueKey(ghIssue.getKey())
                                        .build()
                        );

                        // Cập nhật data từ Jira API
                        entity.setSummary(ghIssue.getSummary());
                        entity.setStatus(ghIssue.getStatus().getName());
                        entity.setIssueType(ghIssue.getIssueType().getName());
                        entity.setAssigneeEmail(ghIssue.getAssignee() != null
                                ? ghIssue.getAssignee().getEmailAddress() : null);
                        entity.setPriority(ghIssue.getPriority() != null
                                ? ghIssue.getPriority().getName() : "None");
                        entity.setDescription(ghIssue.getDescription());
                        entity.setSyncedAt(LocalDateTime.now());

                        synced.add(jiraMapper.toIssueDTO(
                                jiraIssueRepository.save(entity)));
                    });

            log.info("Synced {} issues for jiraId={}", synced.size(), jiraId);
            return synced;

        } catch (Exception e) {
            log.error("Jira sync failed for jiraId={}: {}", jiraId, e.getMessage());
            throw new RuntimeException("Jira sync error: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public JiraIssueResponse createJiraIssue(JiraIssueRequest dto) {
        Jira jira = findJiraOrThrow(dto.getJiraId());

        if (jiraIssueRepository.existsByJiraIssueKey(dto.getJiraIssueKey())) {
            throw new IllegalArgumentException(
                "JiraIssueKey already exists: " + dto.getJiraIssueKey());
        }

        JiraIssue issue = JiraIssue.builder()
                .jira(jira)
                .jiraIssueKey(dto.getJiraIssueKey())
                .taskId(dto.getTaskId())
                .syncedAt(LocalDateTime.now())
                .build();

        return jiraMapper.toIssueDTO(jiraIssueRepository.save(issue));
    }

    @Override
    @Transactional(readOnly = true)
    public JiraIssueResponse getJiraIssueById(UUID jiraIssueId) {
        return jiraMapper.toIssueDTO(findIssueOrThrow(jiraIssueId));
    }

    @Override
    @Transactional(readOnly = true)
    public JiraIssueResponse getJiraIssueByKey(String jiraIssueKey) {
        return jiraMapper.toIssueDTO(
                jiraIssueRepository.findByJiraIssueKey(jiraIssueKey)
                        .orElseThrow(() -> new ResourceNotFoundException(
                            "JiraIssue not found with key: " + jiraIssueKey)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraIssueResponse> getIssuesByJiraId(UUID jiraId) {
        return jiraIssueRepository.findByJira_JiraId(jiraId).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraIssueResponse> getIssuesByTaskId(UUID taskId) {
        return jiraIssueRepository.findByTaskId(taskId).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraIssueResponse> getIssuesByStatus(String status) {
        return jiraIssueRepository.findByStatus(status).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraIssueResponse> getIssuesByJiraIdAndStatus(UUID jiraId, String status) {
        return jiraIssueRepository.findByJira_JiraIdAndStatus(jiraId, status).stream()
                .map(jiraMapper::toIssueDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
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
                .orElseThrow(() ->
                    new ResourceNotFoundException("Jira config not found: " + jiraId));
    }

    private JiraIssue findIssueOrThrow(UUID id) {
        return jiraIssueRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException("JiraIssue not found: " + id));
    }
}
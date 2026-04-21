package uth.edu.jira.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import uth.edu.jira.config.RabbitMQConfig;

import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class JiraEventListener {

    private final JiraIssueService jiraIssueService;
    private final JiraConfigService jiraConfigService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitMQConfig.APP_SYNC_QUEUE)
    public void handleAppEvent(Map<String, Object> event) {
        String type = (String) event.get("type");
        log.info("Received App Sync Event: {}", type);

        try {
            switch (type) {
                case "REQUIREMENT_CREATED":
                    handleRequirementCreated(event);
                    break;
                case "TASK_CREATED":
                    handleTaskCreated(event);
                    break;
                case "REQUIREMENT_DELETED":
                case "TASK_DELETED":
                    handleDeleteEvent(event);
                    break;
                case "SYNC_REQUEST":
                    handleSyncRequest(event);
                    break;
                default:
                    log.warn("Unknown event type: {}", type);
            }
        } catch (Exception e) {
            log.error("Error handling app sync event: {}", e.getMessage());
        }
    }

    private void handleRequirementCreated(Map<String, Object> event) {
        String projectKey = (String) event.get("jiraProjectKey");
        UUID groupId = UUID.fromString((String) event.get("groupId"));
        String title = (String) event.get("title");
        String desc = (String) event.get("description");
        String reqId = (String) event.get("requirementId");

        // Nếu thiếu projectKey, thử tra cứu mapping
        if (projectKey == null || projectKey.isEmpty()) {
            projectKey = jiraConfigService.getJiraConfigsByGroup(groupId).stream()
                .findFirst()
                .map(uth.edu.jira.dto.JiraResponse::getProjectKey)
                .orElse(null);
        }

        if (projectKey == null) {
            log.error("Cannot create Jira issue: No projectKey found for group {}", groupId);
            return;
        }

        // Luôn tạo Requirement là Epic (hoặc Story tùy cấu hình)
        String jiraKey = jiraIssueService.createIssueOnJira(projectKey, title, desc, "Epic", null, groupId);
        
        if (jiraKey != null) {
            // Gửi trả kết quả về cho Requirement Service
            event.put("jiraIssueKey", jiraKey);
            event.put("status", "SUCCESS");
            rabbitTemplate.convertAndSend(RabbitMQConfig.SYNC_EXCHANGE, "jira.assigned", event);
        }
    }

    private void handleTaskCreated(Map<String, Object> event) {
        String projectKey = (String) event.get("jiraProjectKey");
        UUID groupId = UUID.fromString((String) event.get("groupId"));
        String title = (String) event.get("title");
        String desc = (String) event.get("description");
        String parentKey = (String) event.get("parentJiraKey");

        if (projectKey == null || projectKey.isEmpty()) {
            projectKey = jiraConfigService.getJiraConfigsByGroup(groupId).stream()
                .findFirst()
                .map(uth.edu.jira.dto.JiraResponse::getProjectKey)
                .orElse(null);
        }

        if (projectKey == null) {
            log.error("Cannot create Jira issue: No projectKey found for group {}", groupId);
            return;
        }

        // Tạo Task và link tới Epic cha
        String jiraKey = jiraIssueService.createIssueOnJira(projectKey, title, desc, "Task", parentKey, groupId);
        
        if (jiraKey != null) {
            event.put("jiraIssueKey", jiraKey);
            event.put("status", "SUCCESS");
            rabbitTemplate.convertAndSend(RabbitMQConfig.SYNC_EXCHANGE, "jira.assigned", event);
        }
    }

    private void handleDeleteEvent(Map<String, Object> event) {
        String jiraKey = (String) event.get("jiraIssueKey");
        if (jiraKey != null) {
            jiraIssueService.deleteIssueOnJira(jiraKey);
        }
    }

    private void handleSyncRequest(Map<String, Object> event) {
        String projectKey = (String) event.get("jiraProjectKey");
        UUID groupId = UUID.fromString((String) event.get("groupId"));

        if (projectKey == null || projectKey.isEmpty()) {
            projectKey = jiraConfigService.getJiraConfigsByGroup(groupId).stream()
                .findFirst()
                .map(uth.edu.jira.dto.JiraResponse::getProjectKey)
                .orElse(null);
        }

        if (projectKey == null) {
            log.error("Cannot sync Jira project: No projectKey found for group {}", groupId);
            return;
        }

        jiraIssueService.syncProjectFromJira(projectKey, groupId);
    }
}

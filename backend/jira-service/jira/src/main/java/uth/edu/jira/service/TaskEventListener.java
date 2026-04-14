package uth.edu.jira.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import uth.edu.jira.config.RabbitMQConfig;
import uth.edu.jira.dto.TaskEvent;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskEventListener {

    private final JiraIssueService jiraIssueService;

    @RabbitListener(queues = RabbitMQConfig.TASK_QUEUE)
    public void handleTaskEvent(TaskEvent event) {
        log.info("Received TaskEvent: Type={}, TaskId={}, JiraKey={}", 
            event.getEventType(), event.getTaskId(), event.getJiraIssueKey());

        if (event.getJiraIssueKey() == null || event.getJiraIssueKey().isBlank()) {
            log.debug("Skip Jira sync: No jiraIssueKey configured for requirement {}", event.getRequirementId());
            return;
        }

        try {
            String commentBody = formatJiraComment(event);
            jiraIssueService.addCommentToIssue(event.getJiraIssueKey(), commentBody);
            log.info("Successfully added comment to Jira Issue: {}", event.getJiraIssueKey());
        } catch (Exception e) {
            log.error("Failed to sync task activity to Jira: {}", e.getMessage());
        }
    }

    private String formatJiraComment(TaskEvent event) {
        String actionType = event.getEventType() != null ? event.getEventType().toUpperCase() : "UPDATE";
        String statusText = event.getStatus() != null ? event.getStatus() : "N/A";
        
        String actionDescription;
        switch (actionType) {
            case "CREATED":
                actionDescription = "vừa được tạo mới";
                break;
            case "ASSIGN":
                actionDescription = "vừa được giao việc/thay đổi người phụ trách";
                break;
            case "STATUS_UPDATE":
                actionDescription = "vừa cập nhật trạng thái";
                break;
            default:
                actionDescription = "vừa có cập nhật thông tin";
        }

        return String.format(
            "📝 *Thông báo từ Hệ thống Quản lý Project*\n\n" +
            "Công việc: *%s*\n" +
            "Hành động: %s\n" +
            "Trạng thái: *%s*\n" +
            "ID hệ thống: [%s]\n\n" +
            "_Tự động đồng bộ bởi Jira-Sync-Service_",
            event.getTitle(), actionDescription, statusText, event.getTaskId()
        );
    }
}

package uth.edu.jira.service;

import java.util.Map;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import uth.edu.jira.config.RabbitMQConfig;

@Service
public class JiraMessageListener {
    @Autowired
    private JiraIssueService jiraIssueService;

    @Autowired
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Autowired
    private uth.edu.jira.service.JiraConfigService jiraConfigService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void receiveCommitEvent(Map<String, Object> message) {
        try {
            String jiraKey = (String) message.get("jiraKey");
            String commitMsg = (String) message.get("message");
            String commitUrl = (String) message.get("url");

            System.out.println("Processing Jira Task: " + jiraKey);

            // Nội dung comment sẽ gửi lên Jira
            String commentBody = String.format(
                "*Phát hiện commit mới từ GitHub*\n\n" +
                "*Nội dung:* %s\n" +
                "*Chi tiết:* [Xem commit tại đây|%s]", 
                commitMsg, commitUrl
            );

            // Gọi service để thực thi gửi API sang Jira server
            jiraIssueService.addCommentToIssue(jiraKey, commentBody);
            
            System.out.println("Đã thêm comment thành công vào Task: " + jiraKey);
            
        } catch (Exception e) {
            System.err.println("Lỗi khi xử lý tin nhắn Jira commit: " + e.getMessage());
        }
    }

    @RabbitListener(queues = RabbitMQConfig.APP_SYNC_QUEUE)
    public void receiveAppEvent(Map<String, Object> message) {
        try {
            String type = (String) message.get("type");
            String groupIdStr = (String) message.get("groupId");
            if (groupIdStr == null) return;
            
            java.util.UUID groupId = java.util.UUID.fromString(groupIdStr);
            String title = (String) message.get("title");
            String description = (String) message.get("description");
            
            // Tìm projectKey dựa trên groupId
            String projectKey = jiraConfigService.getProjectKeyByGroupId(groupId);
            if (projectKey == null) {
                System.out.println("Không tìm thấy cấu hình Jira cho Group: " + groupId);
                return;
            }

            if ("TASK_CREATED".equals(type)) {
                String taskId = (String) message.get("taskId");
                String parentKey = (String) message.get("parentJiraKey");
                
                System.out.println("🔨 Đang tạo Task trên Jira cho project: " + projectKey);
                String jiraKey = jiraIssueService.createIssueOnJira(projectKey, title, description, "Task", parentKey, groupId);
                
                // Gửi ngược lại thông tin JiraKey để Task-Service cập nhật
                broadcastJiraKey(taskId, jiraKey, "Task", groupId);
            } else if ("REQUIREMENT_CREATED".equals(type)) {
                String requirementId = (String) message.get("requirementId");
                
                System.out.println("Đang tạo Requirement trên Jira cho project: " + projectKey);
                // Với Requirement, thường tạo là Issue Type "Requirement" hoặc "Task" tùy Jira
                String jiraKey = jiraIssueService.createIssueOnJira(projectKey, title, description, "Requirement", null, groupId);
                
                // Gửi ngược lại thông tin JiraKey
                broadcastJiraKey(requirementId, jiraKey, "Requirement", groupId);
            } else if ("TASK_DELETED".equals(type)) {
                String jiraIssueKey = (String) message.get("jiraIssueKey");
                if (jiraIssueKey != null) {
                    System.out.println("🗑️ Đang xóa thẻ Jira: " + jiraIssueKey);
                    jiraIssueService.deleteIssueOnJira(jiraIssueKey);
                }
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi xử lý sự kiện đồng bộ chéo: " + e.getMessage());
        }
    }

    private void broadcastJiraKey(String id, String jiraKey, String type, java.util.UUID groupId) {
        if (jiraKey == null) return;
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("type", "jira.assigned");
        response.put("jiraIssueKey", jiraKey);
        response.put("issueType", type);
        response.put("groupId", groupId.toString());
        
        if ("Task".equals(type)) {
            response.put("taskId", id);
        } else {
            response.put("requirementId", id);
        }

        // Gửi về exchange jira.sync.exchange để các service khác cập nhật JiraKey
        rabbitTemplate.convertAndSend(RabbitMQConfig.SYNC_EXCHANGE, "jira.import", response);
        System.out.println("Đã phát sóng JiraKey " + jiraKey + " cho " + type + " (ID: " + id + ")");
    }
}


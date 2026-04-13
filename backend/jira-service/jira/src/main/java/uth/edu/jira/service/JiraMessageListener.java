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

    @RabbitListener(queues = RabbitMQConfig.QUEUE)
    public void receiveCommitEvent(Map<String, Object> message) {
        try {
            String jiraKey = (String) message.get("jiraKey");
            String commitMsg = (String) message.get("message");
            String commitUrl = (String) message.get("url");

            System.out.println("Processing Jira Task: " + jiraKey);

            // Nội dung comment sẽ gửi lên Jira
            String commentBody = String.format(
                "🚀 *Phát hiện commit mới từ GitHub*\n\n" +
                "*Nội dung:* %s\n" +
                "*Chi tiết:* [Xem commit tại đây|%s]", 
                commitMsg, commitUrl
            );

            // Gọi service để thực thi gửi API sang Jira server
            jiraIssueService.addCommentToIssue(jiraKey, commentBody);
            
            System.out.println("✅ Đã thêm comment thành công vào Task: " + jiraKey);
            
        } catch (Exception e) {
            System.err.println("❌ Lỗi khi xử lý tin nhắn Jira: " + e.getMessage());
        }
    }
}

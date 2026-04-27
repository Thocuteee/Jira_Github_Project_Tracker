package uth.edu.notification.messaging;

import org.springframework.amqp.core.ExchangeTypes;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class SystemSyncListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "notification.monitor.queue", durable = "true"),
            exchange = @Exchange(value = "github_jira_exchange", type = ExchangeTypes.TOPIC),
            key = "github.event.commit"
    ))
    public void onGithubCommitSync(Map<String, Object> message) {
        System.out.println("Nhận được message từ RabbitMQ (Monitor): " + message);
        
        try {
            Map<String, Object> wsMessage = new HashMap<>();
            wsMessage.put("id", UUID.randomUUID().toString());
            
            // Xử lý an toàn nếu message hoặc jiraKey null
            String jiraKey = message.get("jiraKey") != null ? message.get("jiraKey").toString() : "N/A";
            String msg = message.get("message") != null ? message.get("message").toString() : "Commit mới";
            String url = message.get("url") != null ? message.get("url").toString() : "#";
            
            wsMessage.put("message", "Đã đồng bộ commit cho task " + jiraKey + ": " + msg);
            wsMessage.put("user", "System (GitHub -> Jira)");
            wsMessage.put("url", url);
            wsMessage.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM")));
            wsMessage.put("type", "GITHUB_SYNC");

            messagingTemplate.convertAndSend("/topic/sync-monitor", wsMessage);
        } catch (Exception e) {
            System.err.println("Lỗi khi gửi WebSocket message: " + e.getMessage());
        }
    }
}

package uth.edu.notification.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import uth.edu.notification.config.RabbitMQConfig;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.dto.event.TaskEvent;
import uth.edu.notification.service.INotificationService;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskEventConsumer {
    private static final long DEDUPE_TTL_MS = 60_000L;
    private final INotificationService notificationService;
    private final Map<String, Long> processedEventCache = new ConcurrentHashMap<>();

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleTaskEvent(TaskEvent event) {
        try {
            String eventType = event.getEventType() != null ? event.getEventType().toUpperCase() : "";
            NotificationMessageData messageData = buildMessageData(event, eventType);
            if (messageData == null || messageData.recipientId() == null) {
                log.debug("Skipping unsupported or incomplete task event: eventType={}, taskId={}", eventType, event.getTaskId());
                return;
            }
            String eventKey = buildEventKey(event, eventType, messageData.recipientId());
            if (isDuplicateEvent(eventKey)) {
                log.debug("Skip duplicate task event: key={}, taskId={}", eventKey, event.getTaskId());
                return;
            }

            CreateNotificationRequest request = new CreateNotificationRequest();
            request.setUserId(messageData.recipientId());
            request.setTitle(messageData.title());
            request.setMessage(messageData.message());
            request.setAuthToken(event.getAuthToken());
            request.setActionType(eventType);

            notificationService.createNotification(request);
            log.info("Created notification for task event: type={}, taskId={}, userId={}",
                eventType, event.getTaskId(), messageData.recipientId());
        } catch (Exception ex) {
            log.error("Failed to process task event: taskId={}, eventType={}", event.getTaskId(), event.getEventType(), ex);
        }
    }

    private NotificationMessageData buildMessageData(TaskEvent event, String eventType) {
        String taskName = resolveTaskName(event);
        if ("TASK_ASSIGNED".equals(eventType)) {
            UUID recipientId = event.getAssigneeId() != null ? event.getAssigneeId() : event.getAssignedTo();
            return new NotificationMessageData(
                recipientId,
                "Bạn có công việc mới!",
                String.format("Bạn vừa được trưởng nhóm giao thực hiện công việc: %s", taskName)
            );
        }
        if ("TASK_COMPLETED".equals(eventType)) {
            return new NotificationMessageData(
                event.getReporterId(),
                "Công việc đã hoàn thành!",
                String.format("Công việc %s đã được đánh dấu hoàn thành", taskName)
            );
        }
        return null;
    }

    private String resolveTaskName(TaskEvent event) {
        if (event.getTaskName() != null && !event.getTaskName().isBlank()) {
            return event.getTaskName();
        }
        if (event.getTitle() != null && !event.getTitle().isBlank()) {
            return event.getTitle();
        }
        return "Untitled";
    }

    private String buildEventKey(TaskEvent event, String eventType, UUID recipientId) {
        String taskId = event.getTaskId() != null ? event.getTaskId().toString() : "no-task-id";
        String timestamp = event.getTimestamp() != null ? event.getTimestamp().toString() : "no-timestamp";
        return eventType + "|" + taskId + "|" + recipientId + "|" + timestamp;
    }

    private boolean isDuplicateEvent(String eventKey) {
        long now = System.currentTimeMillis();
        processedEventCache.entrySet().removeIf(entry -> now - entry.getValue() > DEDUPE_TTL_MS);
        Long previous = processedEventCache.putIfAbsent(eventKey, now);
        if (previous == null) {
            return false;
        }
        return now - previous <= DEDUPE_TTL_MS;
    }

    private record NotificationMessageData(UUID recipientId, String title, String message) {
    }
}

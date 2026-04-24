package uth.edu.notification.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import uth.edu.notification.config.RabbitMQConfig;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.dto.event.TaskEvent;
import uth.edu.notification.service.INotificationService;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskEventConsumer {
    private final INotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleTaskEvent(TaskEvent event) {
        try {
            String eventType = event.getEventType() != null ? event.getEventType().toUpperCase() : "";
            NotificationMessageData messageData = buildMessageData(event, eventType);
            if (messageData == null || messageData.recipientId() == null) {
                log.debug("Skipping unsupported or incomplete task event: eventType={}, taskId={}", eventType, event.getTaskId());
                return;
            }

            CreateNotificationRequest request = new CreateNotificationRequest();
            request.setUserId(messageData.recipientId());
            request.setTitle(messageData.title());
            request.setMessage(messageData.message());
            request.setAuthToken(event.getAuthToken());

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

    private record NotificationMessageData(UUID recipientId, String title, String message) {
    }
}

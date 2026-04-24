package uth.edu.notification.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import uth.edu.notification.config.RabbitMQConfig;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.dto.event.TaskEvent;
import uth.edu.notification.service.INotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaskEventConsumer {
    private final INotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleTaskEvent(String rawPayload) {
        try {
            TaskEvent event = objectMapper.readValue(rawPayload, TaskEvent.class);
            if (event.getAssignedTo() == null) {
                log.debug("Skipping task event without assignee: taskId={}", event.getTaskId());
                return;
            }

            String title = buildTitle(event);
            String message = buildMessage(event);

            CreateNotificationRequest request = new CreateNotificationRequest();
            request.setUserId(event.getAssignedTo());
            request.setTitle(title);
            request.setMessage(message);

            notificationService.createNotification(request);
            log.info("Created notification for task event: type={}, taskId={}, userId={}",
                event.getEventType(), event.getTaskId(), event.getAssignedTo());
        } catch (JsonProcessingException | IllegalArgumentException ex) {
            log.error("Invalid task event payload, rejecting without requeue: payload={}", rawPayload, ex);
            throw new AmqpRejectAndDontRequeueException("Invalid task event payload", ex);
        } catch (Exception ex) {
            log.error("Failed to process task event payload", ex);
            throw ex;
        }
    }

    private String buildTitle(TaskEvent event) {
        return switch (event.getEventType() != null ? event.getEventType().toUpperCase() : "") {
            case "CREATED" -> "New Task Created";
            case "ASSIGNED" -> "Task Assigned to You";
            case "COMPLETED" -> "Task Completed";
            case "DELETED" -> "Task Deleted";
            default -> "Task Updated";
        };
    }

    private String buildMessage(TaskEvent event) {
        String taskTitle = event.getTitle() != null ? event.getTitle() : "Untitled";
        return switch (event.getEventType() != null ? event.getEventType().toUpperCase() : "") {
            case "CREATED" -> String.format("A new task \"%s\" has been created and assigned to you.", taskTitle);
            case "ASSIGNED" -> String.format("The task \"%s\" has been assigned to you.", taskTitle);
            case "COMPLETED" -> String.format("The task \"%s\" has been marked as completed.", taskTitle);
            case "DELETED" -> String.format("The task \"%s\" has been deleted.", taskTitle);
            default -> String.format("The task \"%s\" has been updated.", taskTitle);
        };
    }
}

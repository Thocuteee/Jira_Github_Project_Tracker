package uth.edu.notification.messaging;

import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import uth.edu.notification.config.RabbitMQConfig;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.dto.event.GroupMemberEvent;
import uth.edu.notification.service.INotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class GroupMemberEventConsumer {
    private final INotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_GROUP_QUEUE)
    public void handleGroupMemberEvent(GroupMemberEvent event) {
        try {
            if (event == null || event.getUserId() == null) {
                log.debug("Skip group member event: missing recipient userId");
                return;
            }
            String eventType = event.getEventType() != null
                ? event.getEventType().toUpperCase(Locale.ROOT)
                : "";
            if (!"MEMBER_ADDED".equals(eventType)) {
                log.debug("Skip unsupported group event type: {}", eventType);
                return;
            }

            CreateNotificationRequest request = new CreateNotificationRequest();
            request.setUserId(event.getUserId());
            request.setTitle("Bạn đã được thêm vào nhóm dự án");
            request.setMessage(buildMemberAddedMessage(event));
            request.setAuthToken(event.getAuthToken());
            request.setActionType(eventType);
            request.setGroupName(event.getGroupName());
            request.setRoleInGroup(event.getRole());
            request.setAdderUserId(event.getAdderId());

            notificationService.createNotification(request);
            log.info("Created group member notification: groupId={}, userId={}, role={}",
                event.getGroupId(), event.getUserId(), event.getRole());
        } catch (Exception ex) {
            log.error("Failed to process GroupMemberEvent: groupId={}, userId={}",
                event != null ? event.getGroupId() : null,
                event != null ? event.getUserId() : null,
                ex
            );
        }
    }

    private String buildMemberAddedMessage(GroupMemberEvent event) {
        String groupName = event.getGroupName() != null && !event.getGroupName().isBlank()
            ? event.getGroupName()
            : "N/A";
        String role = event.getRole() != null ? event.getRole().toUpperCase(Locale.ROOT) : "MEMBER";
        String actorPhrase = resolveActorPhrase(role);

        return String.format(
            "Bạn đã được %s thêm vào nhóm %s với vai trò %s.",
            actorPhrase,
            groupName,
            role
        );
    }

    private String resolveActorPhrase(String role) {
        if ("LECTURER".equals(role) || "LEADER".equals(role)) {
            return "quản trị viên";
        }
        if ("MEMBER".equals(role)) {
            return "trưởng nhóm";
        }
        return "quản trị viên hoặc trưởng nhóm";
    }
}

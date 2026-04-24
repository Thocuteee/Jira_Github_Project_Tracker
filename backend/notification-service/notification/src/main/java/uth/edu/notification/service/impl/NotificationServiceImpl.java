package uth.edu.notification.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.fcm.FcmSender;
import uth.edu.notification.model.Notification;
import uth.edu.notification.repository.NotificationRepository;
import uth.edu.notification.service.IFcmTokenService;
import uth.edu.notification.service.INotificationService;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements INotificationService {
    private final NotificationRepository notificationRepository;
    private final FcmSender fcmSender;
    private final IFcmTokenService fcmTokenService;

    @Override
    public Notification createNotification(CreateNotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        // Best-effort push: try explicit token from request first, then all registered tokens.
        if (StringUtils.hasText(request.getFcmToken())) {
            sendPushSafely(saved.getTitle(), saved.getMessage(), request.getFcmToken());
        } else {
            List<String> tokens = fcmTokenService.getTokensByUserId(request.getUserId());
            for (String token : tokens) {
                sendPushSafely(saved.getTitle(), saved.getMessage(), token);
            }
        }

        return saved;
    }

    private void sendPushSafely(String title, String message, String token) {
        try {
            boolean valid = fcmSender.send(title, message, token);
            if (!valid) {
                log.info("Removing invalid FCM token: {}", token);
                fcmTokenService.removeInvalidToken(token);
            }
        } catch (Exception ex) {
            log.warn("FCM push failed for token (best-effort): {}", token, ex);
        }
    }

    @Override
    public Notification getNotificationById(UUID notificationId) {
        return notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
    }

    @Override
    public List<Notification> getNotificationsByUserId(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Notification updateReadStatus(UUID notificationId, Boolean isRead) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(isRead);
        return notificationRepository.save(notification);
    }

    @Override
    public void deleteNotification(UUID notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification not found");
        }
        notificationRepository.deleteById(notificationId);
    }
}

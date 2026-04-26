package uth.edu.notification.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.fcm.FcmSender;
import uth.edu.notification.model.Notification;
import uth.edu.notification.model.NotificationPreference;
import uth.edu.notification.repository.NotificationRepository;
import uth.edu.notification.service.IEmailService;
import uth.edu.notification.service.IFcmTokenService;
import uth.edu.notification.service.INotificationService;
import uth.edu.notification.service.INotificationPreferenceService;
import uth.edu.notification.service.IUserDirectoryService;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements INotificationService {
    private final NotificationRepository notificationRepository;
    private final FcmSender fcmSender;
    private final IFcmTokenService fcmTokenService;
    private final INotificationPreferenceService notificationPreferenceService;
    private final IUserDirectoryService userDirectoryService;
    private final IEmailService emailService;

    @Override
    public Notification createNotification(CreateNotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        NotificationPreference preference = notificationPreferenceService.getOrCreatePreference(request.getUserId());
        boolean pushEnabled = preference.getPushEnabled();
        boolean emailEnabled = preference.getEmailEnabled();
        if (Boolean.TRUE.equals(pushEnabled)) {
            // Best-effort push: try explicit token from request first, then all registered tokens.
            if (StringUtils.hasText(request.getFcmToken())) {
                sendPushSafely(saved, request.getFcmToken());
            } else {
                List<String> tokens = fcmTokenService.getTokensByUserId(request.getUserId());
                for (String token : tokens) {
                    sendPushSafely(saved, token);
                }
            }
        } else {
            log.debug("Push notifications disabled for userId={}, skip FCM dispatch", request.getUserId());
        }

        if (Boolean.TRUE.equals(emailEnabled)) {
            if (!StringUtils.hasText(request.getAuthToken())) {
                log.warn("Email notification may be skipped due to missing auth token: userId={}", request.getUserId());
            }
            userDirectoryService.findEmailByUserId(request.getUserId(), request.getAuthToken()).ifPresentOrElse(
                email -> emailService.sendEmailAsync(email, saved.getTitle(), toHtmlBody(saved.getTitle(), saved.getMessage())),
                () -> log.warn("Recipient email not found (or auth token missing/expired), skip email notification for userId={}", request.getUserId())
            );
        } else {
            log.debug("Email notifications disabled for userId={}, skip email dispatch", request.getUserId());
        }

        return saved;
    }

    private void sendPushSafely(Notification saved, String token) {
        try {
            Map<String, String> data = new HashMap<>();
            data.put("notificationId", saved.getNotificationId().toString());
            data.put("userId", saved.getUserId().toString());
            data.put("title", saved.getTitle() != null ? saved.getTitle() : "");
            data.put("message", saved.getMessage() != null ? saved.getMessage() : "");
            data.put("createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : "");
            data.put("isRead", Boolean.TRUE.equals(saved.getIsRead()) ? "true" : "false");

            boolean valid = fcmSender.send(saved.getTitle(), saved.getMessage(), token, data);
            if (!valid) {
                log.info("Removing invalid FCM token: {}", token);
                fcmTokenService.removeInvalidToken(token);
            }
        } catch (Exception ex) {
            log.warn("FCM push failed for token (best-effort): {}", token, ex);
        }
    }

    private String toHtmlBody(String title, String message) {
        return "<div style=\"font-family:Arial,sans-serif;line-height:1.5;\">"
            + "<h3 style=\"margin:0 0 12px 0;color:#0f172a;\">" + safe(title) + "</h3>"
            + "<p style=\"margin:0;color:#334155;\">" + safe(message) + "</p>"
            + "</div>";
    }

    private String safe(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;");
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
    @Transactional
    public int markAllAsReadByUserId(UUID userId) {
        return notificationRepository.markAllAsReadByUserId(userId);
    }

    @Override
    public void deleteNotification(UUID notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new RuntimeException("Notification not found");
        }
        notificationRepository.deleteById(notificationId);
    }
}

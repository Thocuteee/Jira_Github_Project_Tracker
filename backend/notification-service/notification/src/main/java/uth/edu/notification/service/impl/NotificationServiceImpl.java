package uth.edu.notification.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.fcm.FcmSender;
import uth.edu.notification.model.Notification;
import uth.edu.notification.repository.NotificationRepository;
import uth.edu.notification.service.INotificationService;

@Service
public class NotificationServiceImpl implements INotificationService {
    private final NotificationRepository notificationRepository;
    private final FcmSender fcmSender;

    public NotificationServiceImpl(NotificationRepository notificationRepository, FcmSender fcmSender) {
        this.notificationRepository = notificationRepository;
        this.fcmSender = fcmSender;
    }

    @Override
    public Notification createNotification(CreateNotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        // Best-effort push notification (lỗi FCM không làm request tạo notification thất bại).
        if (StringUtils.hasText(request.getFcmToken())) {
            try {
                fcmSender.send(notification.getTitle(), notification.getMessage(), request.getFcmToken());
            } catch (Exception ignored) {
                // Intentionally ignore to keep CRUD functional even when Firebase is not configured.
            }
        }

        return notificationRepository.save(notification);
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

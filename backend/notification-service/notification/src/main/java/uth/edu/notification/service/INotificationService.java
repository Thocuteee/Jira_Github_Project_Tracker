package uth.edu.notification.service;

import java.util.List;
import java.util.UUID;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.model.Notification;

public interface INotificationService {
    Notification createNotification(CreateNotificationRequest request);

    Notification getNotificationById(UUID notificationId);

    List<Notification> getNotificationsByUserId(UUID userId);

    Notification updateReadStatus(UUID notificationId, Boolean isRead);

    int markAllAsReadByUserId(UUID userId);

    void deleteNotification(UUID notificationId);
}

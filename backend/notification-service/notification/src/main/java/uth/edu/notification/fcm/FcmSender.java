package uth.edu.notification.fcm;

/**
 * Best-effort Firebase Cloud Messaging sender.
 * <p>
 * Notification CRUD must not fail even if FCM is not configured.
 */
public interface FcmSender {
    void send(String title, String message, String fcmToken);
}


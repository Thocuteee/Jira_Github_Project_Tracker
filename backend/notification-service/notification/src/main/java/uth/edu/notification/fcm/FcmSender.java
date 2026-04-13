package uth.edu.notification.fcm;

/**
 * Best-effort Firebase Cloud Messaging sender.
 * <p>
 * Notification CRUD must not fail even if FCM is not configured.
 */
public interface FcmSender {
    /**
     * @return true if message was sent, false if the token is invalid and should be removed.
     */
    boolean send(String title, String message, String fcmToken);
}


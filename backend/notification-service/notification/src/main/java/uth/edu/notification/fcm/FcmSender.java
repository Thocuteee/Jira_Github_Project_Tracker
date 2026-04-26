package uth.edu.notification.fcm;

import java.util.Map;

/**
 * Best-effort Firebase Cloud Messaging sender.
 * <p>
 * Notification CRUD must not fail even if FCM is not configured.
 */
public interface FcmSender {
    /**
     * @return true if message was sent, false if the token is invalid and should be removed.
     */
    default boolean send(String title, String message, String fcmToken) {
        return send(title, message, fcmToken, null);
    }

    /**
     * @param data optional string map (FCM data payload); values must be non-null strings.
     * @return true if message was sent, false if the token is invalid and should be removed.
     */
    boolean send(String title, String message, String fcmToken, Map<String, String> data);
}


package uth.edu.notification.fcm;

/**
 * No-op fallback when Firebase credentials are not configured.
 */
public class NoOpFcmSender implements FcmSender {
    @Override
    public void send(String title, String message, String fcmToken) {
        // Intentionally do nothing.
    }
}


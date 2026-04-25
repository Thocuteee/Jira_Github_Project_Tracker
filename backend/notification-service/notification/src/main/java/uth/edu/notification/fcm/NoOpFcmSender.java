package uth.edu.notification.fcm;

import java.util.Map;

/**
 * No-op fallback when Firebase credentials are not configured.
 */
public class NoOpFcmSender implements FcmSender {
    @Override
    public boolean send(String title, String message, String fcmToken, Map<String, String> data) {
        return true;
    }
}


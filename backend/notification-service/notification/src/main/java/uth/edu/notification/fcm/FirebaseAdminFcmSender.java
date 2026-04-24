package uth.edu.notification.fcm;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.google.auth.oauth2.GoogleCredentials;
import java.io.FileInputStream;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Firebase Admin SDK based sender.
 * <p>
 * Credentials are provided via service account JSON file path.
 */
public class FirebaseAdminFcmSender implements FcmSender {
    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminFcmSender.class);

    public FirebaseAdminFcmSender(String credentialsPath) throws IOException {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            throw new IllegalArgumentException("Firebase credentials path is empty");
        }

        if (FirebaseApp.getApps().isEmpty()) {
            try (FileInputStream serviceAccount = new FileInputStream(credentialsPath)) {
                FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .build();
                FirebaseApp.initializeApp(options);
            }
        }
    }

    private static final java.util.Set<String> INVALID_TOKEN_CODES = java.util.Set.of(
        "registration-token-not-registered",
        "invalid-registration-token",
        "invalid-argument"
    );

    @Override
    public boolean send(String title, String message, String fcmToken) {
        if (fcmToken == null || fcmToken.isBlank()) {
            return true;
        }

        try {
            Notification firebaseNotification = Notification.builder()
                .setTitle(title == null ? "" : title)
                .setBody(message == null ? "" : message)
                .build();

            Message msg = Message.builder()
                .setToken(fcmToken)
                .setNotification(firebaseNotification)
                .build();

            FirebaseMessaging.getInstance().send(msg);
            return true;
        } catch (com.google.firebase.messaging.FirebaseMessagingException ex) {
            String errorCode = ex.getMessagingErrorCode() != null
                ? ex.getMessagingErrorCode().name().toLowerCase().replace('_', '-')
                : "";
            if (INVALID_TOKEN_CODES.contains(errorCode)) {
                log.info("FCM token is invalid/expired, should be removed: {}", fcmToken);
                return false;
            }
            log.warn("FCM send threw exception (best-effort).", ex);
            return true;
        } catch (Exception ex) {
            log.warn("FCM send threw exception (best-effort).", ex);
            return true;
        }
    }
}


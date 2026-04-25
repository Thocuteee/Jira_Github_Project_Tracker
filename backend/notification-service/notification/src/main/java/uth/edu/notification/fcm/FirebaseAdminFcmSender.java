package uth.edu.notification.fcm;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import uth.edu.notification.service.IFcmTokenService;

/**
 * Firebase Admin SDK based sender.
 * <p>
 * Credentials are provided as {@link GoogleCredentials} (from Base64 JSON or file stream).
 */
public class FirebaseAdminFcmSender implements FcmSender {
    private static final Logger log = LoggerFactory.getLogger(FirebaseAdminFcmSender.class);
    private final IFcmTokenService fcmTokenService;

    public FirebaseAdminFcmSender(GoogleCredentials credentials, IFcmTokenService fcmTokenService) {
        if (credentials == null) {
            throw new IllegalArgumentException("Firebase credentials are null");
        }
        this.fcmTokenService = fcmTokenService;

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();
            FirebaseApp.initializeApp(options);
        }
    }

    @Override
    public boolean send(String title, String message, String fcmToken, Map<String, String> data) {
        if (fcmToken == null || fcmToken.isBlank()) {
            return true;
        }

        try {
            Notification firebaseNotification = Notification.builder()
                .setTitle(title == null ? "" : title)
                .setBody(message == null ? "" : message)
                .build();

            Message.Builder msgBuilder = Message.builder()
                .setToken(fcmToken)
                .setNotification(firebaseNotification);
            if (data != null && !data.isEmpty()) {
                msgBuilder.putAllData(data);
            }
            Message msg = msgBuilder.build();

            FirebaseMessaging.getInstance().send(msg);
            return true;
        } catch (FirebaseMessagingException ex) {
            if (isInvalidTokenError(ex.getMessagingErrorCode())) {
                log.info("FCM token is invalid/expired, removing token immediately: {}", fcmToken);
                fcmTokenService.removeInvalidToken(fcmToken);
                return false;
            }
            log.warn("FCM send threw exception (best-effort).", ex);
            return true;
        } catch (Exception ex) {
            log.warn("FCM send threw exception (best-effort).", ex);
            return true;
        }
    }

    private boolean isInvalidTokenError(MessagingErrorCode errorCode) {
        return errorCode == MessagingErrorCode.UNREGISTERED || errorCode == MessagingErrorCode.INVALID_ARGUMENT;
    }
}

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

    @Override
    public void send(String title, String message, String fcmToken) {
        if (fcmToken == null || fcmToken.isBlank()) {
            return;
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

            // Best-effort: do not affect CRUD outcome.
            // Using synchronous send here to keep the implementation simple and compatible
            // with the ApiFuture return type from firebase-admin.
            FirebaseMessaging.getInstance().send(msg);
        } catch (Exception ex) {
            // Intentionally ignore to keep CRUD functional.
            log.warn("FCM send threw exception (best-effort).", ex);
        }
    }
}


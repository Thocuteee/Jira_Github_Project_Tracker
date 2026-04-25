package uth.edu.notification.fcm;

import com.google.auth.oauth2.GoogleCredentials;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import uth.edu.notification.service.IFcmTokenService;

@Configuration
@RequiredArgsConstructor
public class FcmSenderConfig {
    private static final Logger log = LoggerFactory.getLogger(FcmSenderConfig.class);
    private final IFcmTokenService fcmTokenService;

    /**
     * Service account JSON as Base64 (preferred). Bound from {@code firebase.credentials.base64} /
     * env {@code FIREBASE_CREDENTIALS_BASE64}.
     */
    @Value("${firebase.credentials.base64:}")
    private String firebaseCredentialsBase64;

    /**
     * Optional file path fallback when Base64 is unset or invalid.
     */
    @Value("${FIREBASE_CREDENTIALS_PATH:}")
    private String firebaseCredentialsPath;

    @Bean
    public FcmSender fcmSender() {
        if (StringUtils.hasText(firebaseCredentialsBase64)) {
            try {
                String normalized = firebaseCredentialsBase64.replaceAll("\\s", "");
                byte[] decoded = Base64.getDecoder().decode(normalized);
                try (ByteArrayInputStream bais = new ByteArrayInputStream(decoded)) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(bais);
                    return new FirebaseAdminFcmSender(credentials, fcmTokenService);
                }
            } catch (IllegalArgumentException ex) {
                log.warn(
                    "FCM: firebase.credentials.base64 (FIREBASE_CREDENTIALS_BASE64) is set but is not valid Base64; "
                        + "cannot decode service account JSON. Falling back to FIREBASE_CREDENTIALS_PATH if set.",
                    ex
                );
            } catch (IOException ex) {
                log.warn(
                    "FCM: failed to load Google credentials from decoded Base64. Falling back to FIREBASE_CREDENTIALS_PATH if set.",
                    ex
                );
            }
        } else if (!StringUtils.hasText(firebaseCredentialsPath)) {
            log.warn(
                "FCM: firebase.credentials.base64 is empty (FIREBASE_CREDENTIALS_BASE64 unset) and "
                    + "FIREBASE_CREDENTIALS_PATH is not set; push notifications are disabled."
            );
        } else {
            log.info("FCM: firebase.credentials.base64 empty; loading credentials from FIREBASE_CREDENTIALS_PATH.");
        }

        if (StringUtils.hasText(firebaseCredentialsPath)) {
            try (FileInputStream fis = new FileInputStream(firebaseCredentialsPath)) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(fis);
                return new FirebaseAdminFcmSender(credentials, fcmTokenService);
            } catch (Exception ex) {
                log.warn("FCM disabled due to credential file init error.", ex);
                return new NoOpFcmSender();
            }
        }

        log.info("FCM disabled: no working credentials (Base64 or file path).");
        return new NoOpFcmSender();
    }
}

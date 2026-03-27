package uth.edu.notification.fcm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class FcmSenderConfig {
    private static final Logger log = LoggerFactory.getLogger(FcmSenderConfig.class);

    /**
     * Service account JSON file path.
     * <p>
     * Default: empty => disable FCM sending (notification CRUD vẫn hoạt động).
     */
    @Value("${FIREBASE_CREDENTIALS_PATH:}")
    private String firebaseCredentialsPath;

    @Bean
    public FcmSender fcmSender() {
        if (!StringUtils.hasText(firebaseCredentialsPath)) {
            log.info("FCM disabled: FIREBASE_CREDENTIALS_PATH is not set.");
            return new NoOpFcmSender();
        }

        try {
            return new FirebaseAdminFcmSender(firebaseCredentialsPath);
        } catch (Exception ex) {
            log.warn("FCM disabled due to credential init error.", ex);
            return new NoOpFcmSender();
        }
    }
}


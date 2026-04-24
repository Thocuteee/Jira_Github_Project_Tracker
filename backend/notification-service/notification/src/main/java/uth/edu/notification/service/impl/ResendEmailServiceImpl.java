package uth.edu.notification.service.impl;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import uth.edu.notification.service.IEmailService;

@Service
@Slf4j
public class ResendEmailServiceImpl implements IEmailService {
    private final Resend resend;
    private final String fromEmail;
    private final boolean enabled;

    public ResendEmailServiceImpl(
        @Value("${resend.api-key:}") String resendApiKey,
        @Value("${resend.from-email:no-reply@example.com}") String fromEmail,
        @Value("${resend.enabled:true}") boolean enabled
    ) {
        this.fromEmail = fromEmail;
        this.enabled = enabled;
        this.resend = resendApiKey != null && !resendApiKey.isBlank() ? new Resend(resendApiKey) : null;
    }

    @Override
    @Async
    public void sendEmailAsync(String to, String subject, String body) {
        if (!enabled) {
            log.debug("Resend email is disabled by configuration.");
            return;
        }
        if (to == null || to.isBlank()) {
            log.debug("Skip email sending because recipient address is empty.");
            return;
        }
        if (resend == null) {
            log.warn("Resend client is not initialized. Please configure resend.api-key.");
            return;
        }
        try {
            CreateEmailOptions request = CreateEmailOptions.builder()
                .from(fromEmail)
                .to(to)
                .subject(subject)
                .html(body)
                .build();
            resend.emails().send(request);
        } catch (ResendException ex) {
            log.error("Resend email send failed for recipient {} with subject '{}': {}", to, subject, ex.getMessage(), ex);
        } catch (Exception ex) {
            log.error("Unexpected error while sending Resend email to {}: {}", to, ex.getMessage(), ex);
        }
    }
}

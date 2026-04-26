package uth.edu.notification.service.impl;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.notification.dto.NotificationPreferenceRequest;
import uth.edu.notification.dto.NotificationPreferenceResponse;
import uth.edu.notification.model.NotificationPreference;
import uth.edu.notification.repository.NotificationPreferenceRepository;
import uth.edu.notification.service.INotificationPreferenceService;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceServiceImpl implements INotificationPreferenceService {
    private final NotificationPreferenceRepository notificationPreferenceRepository;

    @Override
    @Transactional
    public NotificationPreference getOrCreatePreference(UUID userId) {
        return notificationPreferenceRepository.findByUserId(userId)
            .orElseGet(() -> notificationPreferenceRepository.save(NotificationPreference.builder()
                .userId(userId)
                .pushEnabled(true)
                .emailEnabled(true)
                .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationPreferenceResponse getPreference(UUID userId) {
        NotificationPreference preference = getOrCreatePreference(userId);
        return toResponse(preference);
    }

    @Override
    @Transactional
    public NotificationPreferenceResponse updatePreference(UUID userId, NotificationPreferenceRequest request) {
        NotificationPreference preference = getOrCreatePreference(userId);
        preference.setPushEnabled(request.getPushEnabled());
        preference.setEmailEnabled(request.getEmailEnabled());
        NotificationPreference saved = notificationPreferenceRepository.save(preference);
        return toResponse(saved);
    }

    private NotificationPreferenceResponse toResponse(NotificationPreference preference) {
        return NotificationPreferenceResponse.builder()
            .userId(preference.getUserId())
            .pushEnabled(preference.getPushEnabled())
            .emailEnabled(preference.getEmailEnabled())
            .updatedAt(preference.getUpdatedAt())
            .build();
    }
}

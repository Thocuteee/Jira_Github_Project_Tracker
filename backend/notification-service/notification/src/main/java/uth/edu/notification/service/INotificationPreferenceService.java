package uth.edu.notification.service;

import java.util.UUID;
import uth.edu.notification.dto.NotificationPreferenceRequest;
import uth.edu.notification.dto.NotificationPreferenceResponse;
import uth.edu.notification.model.NotificationPreference;

public interface INotificationPreferenceService {
    NotificationPreference getOrCreatePreference(UUID userId);

    NotificationPreferenceResponse getPreference(UUID userId);

    NotificationPreferenceResponse updatePreference(UUID userId, NotificationPreferenceRequest request);
}

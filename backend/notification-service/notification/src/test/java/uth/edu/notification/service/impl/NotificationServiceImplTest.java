package uth.edu.notification.service.impl;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.fcm.FcmSender;
import uth.edu.notification.model.Notification;
import uth.edu.notification.model.NotificationPreference;
import uth.edu.notification.repository.NotificationRepository;
import uth.edu.notification.service.IEmailService;
import uth.edu.notification.service.IFcmTokenService;
import uth.edu.notification.service.INotificationPreferenceService;
import uth.edu.notification.service.IUserDirectoryService;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {
    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FcmSender fcmSender;

    @Mock
    private IFcmTokenService fcmTokenService;

    @Mock
    private INotificationPreferenceService notificationPreferenceService;

    @Mock
    private IUserDirectoryService userDirectoryService;

    @Mock
    private IEmailService emailService;

    @InjectMocks
    private NotificationServiceImpl service;

    private static NotificationPreference pushOnlyPreference() {
        return NotificationPreference.builder()
            .userId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .pushEnabled(true)
            .emailEnabled(false)
            .build();
    }

    @Test
    void createNotification_withFcmToken_shouldSendBestEffort() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Test");
        req.setMessage("Hello");
        req.setFcmToken("device-token-1");

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(pushOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setNotificationId(UUID.fromString("00000000-0000-0000-0000-0000000000aa"));
            return n;
        });
        when(fcmSender.send(anyString(), anyString(), anyString(), any())).thenReturn(true);

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(fcmSender, times(1)).send(eq("Test"), eq("Hello"), eq("device-token-1"), any());
    }

    @Test
    void createNotification_withoutFcmToken_shouldLookupRegisteredTokens() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000002");

        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Test2");
        req.setMessage("Hello2");
        req.setFcmToken(null);

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(pushOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification n = invocation.getArgument(0);
            n.setNotificationId(UUID.fromString("00000000-0000-0000-0000-0000000000bb"));
            return n;
        });
        when(fcmTokenService.getTokensByUserId(userId)).thenReturn(List.of("token-a", "token-b"));
        when(fcmSender.send(anyString(), anyString(), anyString(), any())).thenReturn(true);

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(fcmTokenService, times(1)).getTokensByUserId(userId);
        verify(fcmSender, times(1)).send(eq("Test2"), eq("Hello2"), eq("token-a"), any());
        verify(fcmSender, times(1)).send(eq("Test2"), eq("Hello2"), eq("token-b"), any());
    }

    @Test
    void createNotification_withoutFcmToken_noRegisteredTokens_shouldNotSend() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000003");

        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Test3");
        req.setMessage("Hello3");
        req.setFcmToken(null);

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(pushOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(fcmTokenService.getTokensByUserId(userId)).thenReturn(Collections.emptyList());

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verifyNoInteractions(fcmSender);
    }
}

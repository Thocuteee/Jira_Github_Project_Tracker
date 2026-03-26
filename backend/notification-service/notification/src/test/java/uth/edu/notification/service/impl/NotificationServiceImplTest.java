package uth.edu.notification.service.impl;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import uth.edu.notification.dto.CreateNotificationRequest;
import uth.edu.notification.fcm.FcmSender;
import uth.edu.notification.model.Notification;
import uth.edu.notification.repository.NotificationRepository;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {
    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FcmSender fcmSender;

    @InjectMocks
    private NotificationServiceImpl service;

    @Test
    void createNotification_withFcmToken_shouldSendBestEffort() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000001");

        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Test");
        req.setMessage("Hello");
        req.setFcmToken("device-token-1");

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(fcmSender, times(1)).send("Test", "Hello", "device-token-1");
    }

    @Test
    void createNotification_withoutFcmToken_shouldNotSend() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000002");

        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Test2");
        req.setMessage("Hello2");
        req.setFcmToken(null);

        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verifyNoInteractions(fcmSender);
    }
}


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

    @Mock
    private NotificationEmailTemplateBuilder notificationEmailTemplateBuilder;

    @InjectMocks
    private NotificationServiceImpl service;

    private static NotificationPreference pushOnlyPreference() {
        return NotificationPreference.builder()
            .userId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .pushEnabled(true)
            .emailEnabled(false)
            .build();
    }

    private static NotificationPreference emailOnlyPreference() {
        return NotificationPreference.builder()
            .userId(UUID.fromString("00000000-0000-0000-0000-000000000001"))
            .pushEnabled(false)
            .emailEnabled(true)
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

    @Test
    void createNotification_taskAssigned_shouldSendProfessionalHtmlEmail() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000004");
        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Bạn có công việc mới!");
        req.setMessage("Bạn vừa được trưởng nhóm giao thực hiện công việc: Implement Login Flow");
        req.setActionType("TASK_ASSIGNED");
        req.setAuthToken("Bearer token-value");

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(emailOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userDirectoryService.findEmailByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("leader@example.com"));
        when(userDirectoryService.findDisplayNameByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("Nguyen Van A"));
        when(notificationEmailTemplateBuilder.buildTaskAssignedEmail("Nguyen Van A", "Implement Login Flow"))
            .thenReturn("<html>assigned-template</html>");

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(emailService, times(1))
            .sendEmailAsync("leader@example.com", "Bạn có công việc mới!", "<html>assigned-template</html>");
    }

    @Test
    void createNotification_taskCompleted_shouldSendProfessionalHtmlEmail() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000005");
        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Công việc đã hoàn thành!");
        req.setMessage("Công việc Build Notification Email đã được đánh dấu hoàn thành");
        req.setActionType("TASK_COMPLETED");
        req.setAuthToken("Bearer token-value");

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(emailOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userDirectoryService.findEmailByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("owner@example.com"));
        when(userDirectoryService.findDisplayNameByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("Tran Thi B"));
        when(notificationEmailTemplateBuilder.buildTaskCompletedEmail("Tran Thi B", "Công việc Build Notification Email đã được đánh dấu hoàn thành"))
            .thenReturn("<html>completed-template</html>");

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(emailService, times(1))
            .sendEmailAsync("owner@example.com", "Công việc đã hoàn thành!", "<html>completed-template</html>");
    }

    @Test
    void createNotification_memberAdded_shouldSendProfessionalHtmlEmail() {
        UUID userId = UUID.fromString("00000000-0000-0000-0000-000000000006");
        UUID adderId = UUID.fromString("00000000-0000-0000-0000-000000000007");
        CreateNotificationRequest req = new CreateNotificationRequest();
        req.setUserId(userId);
        req.setTitle("Bạn đã được thêm vào nhóm dự án");
        req.setMessage("Bạn đã được Leader thêm vào nhóm Demo với vai trò MEMBER.");
        req.setActionType("MEMBER_ADDED");
        req.setGroupName("Demo Group");
        req.setRoleInGroup("MEMBER");
        req.setAdderUserId(adderId);
        req.setAuthToken("Bearer token-value");

        when(notificationPreferenceService.getOrCreatePreference(userId)).thenReturn(emailOnlyPreference());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userDirectoryService.findEmailByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("member@example.com"));
        when(userDirectoryService.findDisplayNameByUserId(eq(userId), anyString())).thenReturn(java.util.Optional.of("Le Thi C"));
        when(userDirectoryService.findDisplayNameByUserId(eq(adderId), anyString())).thenReturn(java.util.Optional.of("Leader Tran"));
        when(notificationEmailTemplateBuilder.buildMemberAddedEmail("Le Thi C", "Demo Group", "MEMBER", "Leader Tran"))
            .thenReturn("<html>member-added-template</html>");

        Notification created = service.createNotification(req);

        assertNotNull(created);
        verify(emailService, times(1))
            .sendEmailAsync("member@example.com", "Bạn đã được thêm vào nhóm dự án", "<html>member-added-template</html>");
    }
}

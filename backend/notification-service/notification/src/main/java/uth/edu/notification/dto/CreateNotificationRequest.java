package uth.edu.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateNotificationRequest {
    @NotNull
    private UUID userId;

    @NotBlank
    private String title;

    @NotBlank
    private String message;

    // Optional: Firebase token (FCM) của thiết bị/client.
    // Nếu null/trống hoặc cấu hình Firebase thiếu thì notification vẫn được lưu DB bình thường.
    private String fcmToken;

    // Optional: JWT của user phát sinh event, dùng cho service-to-service call cần bảo mật.
    private String authToken;

    // Optional: loại sự kiện nghiệp vụ (vd: TASK_ASSIGNED, TASK_COMPLETED) để render email template phù hợp.
    private String actionType;

    // Optional: metadata cho email template MEMBER_ADDED.
    private String groupName;
    private String roleInGroup;
    private UUID adderUserId;
}

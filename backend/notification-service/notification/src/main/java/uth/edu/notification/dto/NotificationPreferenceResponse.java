package uth.edu.notification.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationPreferenceResponse {
    private UUID userId;
    private Boolean pushEnabled;
    private Boolean emailEnabled;
    private LocalDateTime updatedAt;
}

package uth.edu.notification.dto.event;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupMemberEvent {
    private UUID groupId;
    private String groupName;
    private UUID userId;
    private UUID adderId;
    private String role;
    private String eventType;
}

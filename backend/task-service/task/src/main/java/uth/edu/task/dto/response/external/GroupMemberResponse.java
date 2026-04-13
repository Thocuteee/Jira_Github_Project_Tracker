package uth.edu.task.dto.response.external;

import lombok.Data;
import java.util.UUID;

@Data
public class GroupMemberResponse {
    private UUID userId;
    private String roleInGroup;
}

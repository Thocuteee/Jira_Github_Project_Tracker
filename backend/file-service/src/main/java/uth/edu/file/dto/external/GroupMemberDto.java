package uth.edu.file.dto.external;

import lombok.Data;
import java.util.UUID;

@Data
public class GroupMemberDto {
    private UUID userId;
    private String roleInGroup;
}

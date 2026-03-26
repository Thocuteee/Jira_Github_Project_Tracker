package uth.edu.group.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MemberRequest {
    private UUID userId;
    private String roleInGroup;
}
package uth.edu.export.dto.response;

import java.util.UUID;

import lombok.Data;

@Data
public class GroupInfoResponse {
    private UUID groupId;
    private String groupName;
}

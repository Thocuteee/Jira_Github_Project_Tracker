package uth.edu.group.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class GroupStatsResponse {
    private UUID groupId;
    private String groupName;
    private long memberCount;
}


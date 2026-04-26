package uth.edu.export.dto.response;

import java.util.UUID;

import lombok.Data;

@Data
public class UserInfoResponse {
    private UUID userId;
    private String name;
}

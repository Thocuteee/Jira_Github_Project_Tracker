package uth.edu.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@AllArgsConstructor
public class ProfileResponse {
    private UUID userId;
    private String fullName;
    private String name;
    private String email;
    private Set<String> roles;
    private String avatarUrl;
    private LocalDateTime createdAt;
    /** true nếu user dùng mật khẩu marker OAuth (Google/GitHub), không đổi mật khẩu local tại đây */
    private boolean oauthAccount;
}

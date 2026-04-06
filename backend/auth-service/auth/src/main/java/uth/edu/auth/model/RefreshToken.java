package uth.edu.auth.model;

import uth.edu.auth.model.User;
import java.time.Instant;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {
    private User user;
    private String token;
    private Instant expiryDate;
}
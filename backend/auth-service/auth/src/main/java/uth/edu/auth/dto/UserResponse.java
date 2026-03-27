package uth.edu.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
@AllArgsConstructor
public class UserResponse {
    private UUID userId;
    private String name;
    private String email;
    private Set<String> roles; 
}
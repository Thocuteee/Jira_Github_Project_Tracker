package uth.edu.auth.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private String email;
    private List<String> roles;

    public JwtResponse(String token, String refreshToken, String email, List<String> roles) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.roles = roles;
    }

}

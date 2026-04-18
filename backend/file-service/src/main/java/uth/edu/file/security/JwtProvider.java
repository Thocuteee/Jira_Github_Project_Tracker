package uth.edu.file.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private SecretKey getSigningKey() {
        try {
            byte[] keyBytes = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(secretKey.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("Không thể khởi tạo khóa ký JWT: ", e);
        }
    }
}

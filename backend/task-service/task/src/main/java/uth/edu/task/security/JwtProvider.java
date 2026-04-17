package uth.edu.task.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Component
public class JwtProvider {

    @Value("${jwt.secret:dev-secret-change-me}")
    private String jwtSecret;

    private Key getSigningKey() {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                    .digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Cannot initialize JWT signing key", e);
        }
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT Token expired: {}", e.getMessage());
        } catch (SignatureException e) {
            log.error("JWT Signature invalid (secret mismatch?): {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("JWT Malformed: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.error("JWT validation failed: {} - {}", e.getClass().getSimpleName(), e.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

package uth.edu.auth.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtProvider {
    @Value("${auth.jwt.secret}")
    private String jwtSecret;

    @Value("${auth.jwt.expiration}")
    private int jwtExpirationMs;

    private Key getSigningKey() {
        try {
            byte[] keyBytes = MessageDigest.getInstance("SHA-256")
                    .digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Cannot initialize JWT signing key", e);
        }
    }

    public String generateJwtToken(uth.edu.auth.model.User user) {
        String role = user.getRoles().stream()
                .map(r -> r.getName().name())
                .findFirst()
                .orElse("ROLE_TEAM_MEMBER");

        return Jwts.builder()
            .setSubject(user.getEmail())
            .claim("userId", user.getUserId().toString())
            .claim("role", role)
            .setIssuedAt(new Date())
            .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
            .setSigningKey(getSigningKey())
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(getSigningKey()).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            System.err.println("JWT không hợp lệ: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.err.println("JWT token không hợp lệ: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token hết hạn: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token không hỗ trợ: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("Chuỗi yêu cầu JWT trống: " + e.getMessage());
        }
        return false;
    }
}

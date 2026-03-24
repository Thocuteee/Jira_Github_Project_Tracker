package uth.edu.auth.security;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;

@Component
public class JwtProvider {
    @Value("${auth.jwt.secret}")
    private String jwtSecret;

    @Value("${auth.jwt.expiration}")
    private int jwtExpirationMs;

    public String generateJwtToken(String email) {
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(new Date())
            .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS256, jwtSecret)
            .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
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

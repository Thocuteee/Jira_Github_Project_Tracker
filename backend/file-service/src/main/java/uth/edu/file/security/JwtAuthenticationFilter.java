package uth.edu.file.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import uth.edu.file.config.UserContextHolder;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtProvider.validateToken(token)) {
                    Claims claims = jwtProvider.getClaims(token);
                    String userId = claims.get("userId", String.class);
                    String role = claims.get("role", String.class);

                    if (userId != null && !userId.trim().isEmpty()) {
                        UserContextHolder.setUserId(UUID.fromString(userId));
                        UserContextHolder.setUserRole(role);

                        String finalRole = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + role;
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userId, null, Collections.singletonList(new SimpleGrantedAuthority(finalRole)));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } else {
                String userIdHeader = request.getHeader("X-User-Id");
                String roleHeader = request.getHeader("X-User-Role");

                if (userIdHeader != null && !userIdHeader.trim().isEmpty()) {
                    try {
                        UUID userId = UUID.fromString(userIdHeader);
                        String role = roleHeader != null ? roleHeader : "TEAM_MEMBER";

                        UserContextHolder.setUserId(userId);
                        UserContextHolder.setUserRole(role);

                        String finalRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userIdHeader, null, Collections.singletonList(new SimpleGrantedAuthority(finalRole)));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid UUID format in X-User-Id: {}", userIdHeader);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in JwtAuthenticationFilter: ", e);
        }

        filterChain.doFilter(request, response);
    }
}

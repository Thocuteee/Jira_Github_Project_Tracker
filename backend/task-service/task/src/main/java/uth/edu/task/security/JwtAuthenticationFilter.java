package uth.edu.task.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import uth.edu.task.config.UserContextHolder;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtProvider.validateToken(jwt)) {
                // Case 1: Valid JWT token
                log.info("JwtAuthenticationFilter: Authenticated via JWT token");
                Claims claims = jwtProvider.getClaims(jwt);
                String email = claims.getSubject();
                String userIdStr = claims.get("userId", String.class);
                String role = claims.get("role", String.class);

                if (role == null) role = "ROLE_TEAM_MEMBER";
                if (!role.startsWith("ROLE_")) role = "ROLE_" + role;

                if (userIdStr != null) UserContextHolder.setUserId(UUID.fromString(userIdStr));
                UserContextHolder.setUserRole(role);

                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

            } else {
                // Case 2: Fallback to X-User-Id / X-User-Role headers injected by API Gateway
                String userIdHeader = request.getHeader("X-User-Id");
                String roleHeader = request.getHeader("X-User-Role");

                if (StringUtils.hasText(userIdHeader)) {
                    log.info("JwtAuthenticationFilter: Authenticated via X-User-Id header");
                    try {
                        UUID userId = UUID.fromString(userIdHeader);
                        String role = StringUtils.hasText(roleHeader) ? roleHeader : "TEAM_MEMBER";
                        if (!role.startsWith("ROLE_")) role = "ROLE_" + role;

                        UserContextHolder.setUserId(userId);
                        UserContextHolder.setUserRole(role);

                        List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userIdHeader, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid UUID format in X-User-Id header: {}", userIdHeader);
                    }
                } else {
                    log.warn("JwtAuthenticationFilter: No valid JWT or X-User-Id found for: {}", request.getRequestURI());
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        // 1. Check Authorization Header
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 2. Check accessToken Cookie
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}

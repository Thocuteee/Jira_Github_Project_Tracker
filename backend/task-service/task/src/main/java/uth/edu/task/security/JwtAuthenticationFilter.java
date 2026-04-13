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
            if (jwt != null) {
                log.info("JwtAuthenticationFilter: Received JWT token");
            } else {
                log.warn("JwtAuthenticationFilter: No JWT token found in request to: {}", request.getRequestURI());
            }

            if (StringUtils.hasText(jwt) && jwtProvider.validateToken(jwt)) {
                Claims claims = jwtProvider.getClaims(jwt);
                String email = claims.getSubject();
                String userIdStr = claims.get("userId", String.class);
                String role = claims.get("role", String.class);

                if (role == null)
                    role = "ROLE_TEAM_MEMBER";
                if (!role.startsWith("ROLE_"))
                    role = "ROLE_" + role;

                // Thiết lập UserContextHolder để các Service cũ vẫn chạy đúng
                if (userIdStr != null) {
                    UserContextHolder.setUserId(UUID.fromString(userIdStr));
                }
                if (role != null) {
                    UserContextHolder.setUserRole(role);
                }

                List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Sau khi kết thúc request, clear context
            UserContextHolder.clear();
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

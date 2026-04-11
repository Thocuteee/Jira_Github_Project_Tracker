package uth.edu.task.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
public class UserContextInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String userIdStr = request.getHeader("X-User-Id");
        String userRole = request.getHeader("X-User-Role");

        if (userIdStr != null && !userIdStr.trim().isEmpty()) {
            try {
                UUID userId = UUID.fromString(userIdStr);
                UserContextHolder.setUserId(userId);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("X-User-Id không đúng định dạng UUID!");
            }
        }

        if (userRole != null) {
            UserContextHolder.setUserRole(userRole);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContextHolder.clear();
    }
}

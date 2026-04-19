package uth.edu.file.client;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import uth.edu.file.config.UserContextHolder;

import java.util.UUID;

@Slf4j
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor headerPropagationInterceptor() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null) {
                    template.header("Authorization", authHeader);
                }
            }

            UUID userId = UserContextHolder.getUserId();
            String role = UserContextHolder.getUserRole();

            if (userId != null) {
                template.header("X-User-Id", userId.toString());
            }
            if (role != null) {
                template.header("X-User-Role", role);
            }

            String correlationId = template.headers().containsKey("X-Correlation-Id")
                    ? template.headers().get("X-Correlation-Id").iterator().next()
                    : java.util.UUID.randomUUID().toString();
            template.header("X-Correlation-Id", correlationId);
        };
    }
}

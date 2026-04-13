package uth.edu.task.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                UUID userId = UserContextHolder.getUserId();
                String role = UserContextHolder.getUserRole();

                if (userId != null) {
                    template.header("X-User-Id", userId.toString());
                }
                
                if (role != null) {
                    template.header("X-User-Role", role);
                }
            }
        };
    }
}

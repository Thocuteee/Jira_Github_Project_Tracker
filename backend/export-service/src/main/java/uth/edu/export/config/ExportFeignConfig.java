package uth.edu.export.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import uth.edu.export.context.ExportFeignContext;

@Configuration
public class ExportFeignConfig {

    @Bean
    public RequestInterceptor exportUserForwardingInterceptor() {
        return requestTemplate -> {
            java.util.UUID userId = ExportFeignContext.getRequestingUserId();
            if (userId != null) {
                requestTemplate.header("X-User-Id", userId.toString());
                requestTemplate.header("X-User-Role", "TEAM_MEMBER");
            }
        };
    }
}

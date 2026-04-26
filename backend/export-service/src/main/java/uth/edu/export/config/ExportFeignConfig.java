package uth.edu.export.config;

import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;

import feign.RequestInterceptor;
import uth.edu.export.context.ExportFeignContext;

@Configuration
public class ExportFeignConfig {

    /**
     * Nếu có JWT (Authorization) thì chỉ gửi Bearer — file-service ưu tiên X-User-Id nên không được
     * gửi kèm X-User-Id khi muốn xác thực bằng JWT. Ngược lại gửi X-User-Id / X-User-Role cho luồng nội bộ.
     */
    @Bean
    public RequestInterceptor exportUserForwardingInterceptor() {
        return requestTemplate -> {
            String bearer = ExportFeignContext.getBearerToken();
            if (StringUtils.hasText(bearer)) {
                String trimmed = bearer.trim();
                if (trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
                    requestTemplate.header(HttpHeaders.AUTHORIZATION, trimmed);
                } else {
                    requestTemplate.header(HttpHeaders.AUTHORIZATION, "Bearer " + trimmed);
                }
                return;
            }
            UUID userId = ExportFeignContext.getRequestingUserId();
            if (userId != null) {
                requestTemplate.header("X-User-Id", userId.toString());
                requestTemplate.header("X-User-Role", "TEAM_MEMBER");
            }
        };
    }
}

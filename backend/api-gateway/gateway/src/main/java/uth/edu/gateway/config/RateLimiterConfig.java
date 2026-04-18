package uth.edu.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    /**
     * Định nghĩa bộ giới hạn tốc độ (Rate Limiter) bằng Java để tránh lỗi cấu hình trong properties.
     * 5 requests per second, 10 burst capacity.
     */
    @Bean
    public RedisRateLimiter redisRateLimiter() {
        return new RedisRateLimiter(5, 10);
    }

    /**
     * Xác định "Key" để giới hạn lưu lượng.
     */
    @Bean
    @Primary
    public KeyResolver userKeyResolver() {
        return exchange -> {
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");

            if (userId != null && !userId.isBlank()) {
                return Mono.just(userId);
            }
            
            if (exchange.getRequest().getRemoteAddress() != null && 
                exchange.getRequest().getRemoteAddress().getAddress() != null) {
                return Mono.just(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
            }

            return Mono.just("anonymous");
        };
    }
}

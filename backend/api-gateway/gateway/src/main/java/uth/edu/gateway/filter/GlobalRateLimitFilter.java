package uth.edu.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Component
public class GlobalRateLimitFilter implements GlobalFilter, Ordered {

    @Autowired
    private RedisRateLimiter redisRateLimiter;

    @Autowired
    private KeyResolver userKeyResolver;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return userKeyResolver.resolve(exchange).flatMap(key -> 
            redisRateLimiter.isAllowed("global_limit", key).flatMap(response -> {
                
                // Thêm các header thông tin rate limit vào response (tùy chọn nhưng chuyên nghiệp)
                for (Map.Entry<String, String> header : response.getHeaders().entrySet()) {
                    exchange.getResponse().getHeaders().add(header.getKey(), header.getValue());
                }

                if (response.isAllowed()) {
                    return chain.filter(exchange);
                }

                log.warn("Rate limit exceeded for key: {}", key);
                exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                return exchange.getResponse().setComplete();
            })
        );
    }

    @Override
    public int getOrder() {
        // Order cao hơn AuthenticationFilter để đảm bảo X-User-Id đã được inject
        return 1; 
    }
}

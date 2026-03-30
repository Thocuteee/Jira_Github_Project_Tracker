package uth.edu.apigateway.filter;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uth.edu.apigateway.config.RateLimitProperties;
import uth.edu.apigateway.util.ErrorResponseWriter;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final RateLimitProperties rateLimitProperties;
    private final Map<String, FixedWindowCounter> counters = new ConcurrentHashMap<>();

    public RateLimitFilter(RateLimitProperties rateLimitProperties) {
        this.rateLimitProperties = rateLimitProperties;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!rateLimitProperties.isEnabled()) {
            return chain.filter(exchange);
        }

        String key = resolveKey(exchange);
        FixedWindowCounter counter = counters.computeIfAbsent(key, ignored -> new FixedWindowCounter());
        int currentCount = counter.incrementAndGet();

        if (currentCount > rateLimitProperties.getRequestsPerMinute()) {
            exchange.getResponse().getHeaders().set("Retry-After", "60");
            return ErrorResponseWriter.write(exchange, HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", "Too many requests");
        }
        return chain.filter(exchange);
    }

    private String resolveKey(ServerWebExchange exchange) {
        String user = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (user != null && !user.isBlank()) {
            return "usr:" + user;
        }
        if (exchange.getRequest().getRemoteAddress() != null && exchange.getRequest().getRemoteAddress().getAddress() != null) {
            return "ip:" + exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }
        return "ip:unknown";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }

    private static final class FixedWindowCounter {

        private volatile long windowStartEpochSeconds = Instant.now().getEpochSecond();
        private final AtomicInteger count = new AtomicInteger(0);

        int incrementAndGet() {
            long now = Instant.now().getEpochSecond();
            if (now - windowStartEpochSeconds >= 60) {
                synchronized (this) {
                    if (now - windowStartEpochSeconds >= 60) {
                        windowStartEpochSeconds = now;
                        count.set(0);
                    }
                }
            }
            return count.incrementAndGet();
        }
    }
}

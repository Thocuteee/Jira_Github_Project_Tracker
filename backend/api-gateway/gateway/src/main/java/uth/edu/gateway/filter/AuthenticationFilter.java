package uth.edu.gateway.filter;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uth.edu.gateway.jwt.JwtProvider;

import java.util.List;

@Slf4j
@Component
public class AuthenticationFilter implements GlobalFilter {

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private ReactiveStringRedisTemplate redisTemplate;

    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/auth/",
            "/api/v1/auth/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Skip auth for open endpoints
        if (OPEN_ENDPOINTS.stream().anyMatch(path::contains)) {
            return chain.filter(exchange);
        }

        // 2. Check Authorization Header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            log.warn("Missing Authorization Header for path: {}", path);
            return onError(exchange, "Missing Authorization Header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid Authorization Header format for path: {}", path);
            return onError(exchange, "Invalid Authorization Header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        
        // 3. Check Blacklist in Redis with timeout and fallback
        return redisTemplate.hasKey("auth:blacklist:" + token)
                .timeout(java.time.Duration.ofSeconds(2)) // Don't hang if Redis is slow
                .onErrorResume(e -> {
                    log.error("Redis error in auth-filter: {}", e.getMessage());
                    return reactor.core.publisher.Mono.just(false); // Fallback to not-blacklisted
                })
                .defaultIfEmpty(false)
                .flatMap(isBlacklisted -> {
                    if (Boolean.TRUE.equals(isBlacklisted)) {
                        log.warn("Token is blacklisted: {}", token);
                        return onError(exchange, "Token is revoked", HttpStatus.UNAUTHORIZED);
                    }

                    // 4. Validate Token
                    if (!jwtProvider.validateToken(token)) {
                        log.warn("Invalid JWT Token for path: {}", path);
                        return onError(exchange, "Invalid Token", HttpStatus.UNAUTHORIZED);
                    }

                    try {
                        Claims claims = jwtProvider.getClaims(token);
                        String userId = claims.get("userId", String.class);
                        String role = claims.get("role", String.class);

                        log.info("Authenticated user: {} with role: {}", userId, role);

                        // 5. Inject headers
                        ServerHttpRequest modifiedRequest = request.mutate()
                                .header("X-User-Id", userId)
                                .header("X-User-Role", role)
                                .build();

                        return chain.filter(exchange.mutate().request(modifiedRequest).build());
                    } catch (Exception e) {
                        log.error("Error parsing JWT claims", e);
                        return onError(exchange, "Invalid Token Claims", HttpStatus.UNAUTHORIZED);
                    }
                });
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        log.error("Authentication Error: {} - Status: {}", err, status);
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        return response.setComplete();
    }
}

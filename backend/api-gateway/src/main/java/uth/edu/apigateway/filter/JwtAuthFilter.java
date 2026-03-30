package uth.edu.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uth.edu.apigateway.config.GatewaySecurityProperties;
import uth.edu.apigateway.util.ErrorResponseWriter;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private final GatewaySecurityProperties securityProperties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Value("${gateway.jwt.secret}")
    private String jwtSecret;

    public JwtAuthFilter(GatewaySecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();
        if (isPublicPath(path) || !isProtectedPath(path)) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Missing bearer token");
        }

        String token = authHeader.substring(7);
        Claims claims;
        try {
            claims = Jwts.parserBuilder()
                .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (JwtException | IllegalArgumentException ex) {
            return ErrorResponseWriter.write(exchange, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid or expired token");
        }

        String userId = claims.getSubject();
        List<String> roles = extractRoles(claims);
        if (!isRoleAllowed(path, roles)) {
            return ErrorResponseWriter.write(exchange, HttpStatus.FORBIDDEN, "FORBIDDEN", "Insufficient role");
        }

        ServerHttpRequest request = exchange.getRequest().mutate()
            .header("X-User-Id", userId == null ? "" : userId)
            .header("X-Roles", String.join(",", roles))
            .header("X-User-Role", roles.isEmpty() ? "" : roles.get(0))
            .build();

        return chain.filter(exchange.mutate().request(request).build());
    }

    private boolean isPublicPath(String path) {
        return securityProperties.getPublicPaths().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private boolean isProtectedPath(String path) {
        return securityProperties.getProtectedPaths().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private boolean isRoleAllowed(String path, List<String> userRoles) {
        for (Map.Entry<String, List<String>> entry : securityProperties.getRoleRules().entrySet()) {
            if (pathMatcher.match(entry.getKey(), path)) {
                List<String> requiredRoles = entry.getValue();
                if (requiredRoles == null || requiredRoles.isEmpty()) {
                    return true;
                }
                return userRoles.stream().anyMatch(requiredRoles::contains);
            }
        }
        return true;
    }

    @SuppressWarnings("unchecked")
    private List<String> extractRoles(Claims claims) {
        Object rolesObj = claims.get("roles");
        if (rolesObj == null) {
            rolesObj = claims.get("authorities");
        }
        if (rolesObj instanceof List<?> list) {
            return list.stream().map(String::valueOf).toList();
        }
        if (rolesObj instanceof String value && !value.isBlank()) {
            return List.of(value);
        }
        return Collections.emptyList();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}

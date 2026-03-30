package uth.edu.apigateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uth.edu.apigateway.util.ErrorResponseWriter;

@Component
public class ErrorHandlingFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).onErrorResume(ex -> {
            if (ex instanceof ResponseStatusException responseStatusException) {
                HttpStatus status = HttpStatus.resolve(responseStatusException.getStatusCode().value());
                if (status == null) {
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                }
                String reason = responseStatusException.getReason() == null ? "Upstream request failed" : responseStatusException.getReason();
                return ErrorResponseWriter.write(exchange, status, "UPSTREAM_ERROR", reason);
            }
            return ErrorResponseWriter.write(exchange, HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Unhandled gateway error");
        });
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}

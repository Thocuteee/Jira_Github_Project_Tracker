package uth.edu.apigateway.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import uth.edu.apigateway.filter.RequestTracingFilter;

public final class ErrorResponseWriter {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ErrorResponseWriter() {
    }

    public static Mono<Void> write(ServerWebExchange exchange, HttpStatus status, String code, String message) {
        if (exchange.getResponse().isCommitted()) {
            return Mono.empty();
        }

        String traceId = exchange.getRequest().getHeaders().getFirst(RequestTracingFilter.TRACE_HEADER);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("path", exchange.getRequest().getPath().value());
        body.put("code", code);
        body.put("message", message);
        body.put("traceId", traceId);

        byte[] payload = toBytes(body);
        DataBuffer buffer = exchange.getResponse().bufferFactory().wrap(payload);

        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        exchange.getResponse().getHeaders().set(HttpHeaders.CACHE_CONTROL, "no-store");

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private static byte[] toBytes(Map<String, Object> body) {
        try {
            return OBJECT_MAPPER.writeValueAsBytes(body);
        } catch (JsonProcessingException ignored) {
            return "{\"code\":\"INTERNAL_ERROR\",\"message\":\"Cannot serialize error body\"}".getBytes(StandardCharsets.UTF_8);
        }
    }
}

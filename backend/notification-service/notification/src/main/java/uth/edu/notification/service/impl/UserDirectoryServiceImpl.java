package uth.edu.notification.service.impl;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import uth.edu.notification.service.IUserDirectoryService;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserDirectoryServiceImpl implements IUserDirectoryService {
    private final RestTemplate restTemplate;

    @Value("${auth.service.base-url:http://api-gateway:8080}")
    private String authServiceBaseUrl;

    @Override
    public Optional<String> findEmailByUserId(UUID userId, String authToken) {
        return fetchUserById(userId, authToken).flatMap(body -> getStringField(body, "email"));
    }

    @Override
    public Optional<String> findDisplayNameByUserId(UUID userId, String authToken) {
        Optional<Map> userBody = fetchUserById(userId, authToken);
        if (userBody.isEmpty()) {
            return Optional.empty();
        }
        Map body = userBody.get();
        return getStringField(body, "fullName")
            .or(() -> getStringField(body, "name"))
            .or(() -> getStringField(body, "username"))
            .or(() -> getStringField(body, "email"));
    }

    private Optional<Map> fetchUserById(UUID userId, String authToken) {
        if (userId == null || !StringUtils.hasText(authToken)) {
            return Optional.empty();
        }
        String url = authServiceBaseUrl + "/api/auth/users/" + userId;
        try {
            String normalizedToken = extractBearerToken(authToken);
            if (!StringUtils.hasText(normalizedToken)) {
                log.debug("Skip resolving recipient email because auth token is missing after normalization for userId={}", userId);
                return Optional.empty();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(normalizedToken);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, requestEntity, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return Optional.empty();
            }
            return Optional.of(response.getBody());
        } catch (Exception ex) {
            log.warn("Failed to resolve user profile from auth-service for userId={}: {}", userId, ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> getStringField(Map body, String key) {
        Object value = body.get(key);
        if (value instanceof String stringValue && !stringValue.isBlank()) {
            return Optional.of(stringValue);
        }
        return Optional.empty();
    }

    private String extractBearerToken(String authHeader) {
        if (!StringUtils.hasText(authHeader)) {
            return null;
        }
        String trimmed = authHeader.trim();
        if (trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = trimmed.substring(7).trim();
            return token.isEmpty() ? null : token;
        }
        return trimmed;
    }
}

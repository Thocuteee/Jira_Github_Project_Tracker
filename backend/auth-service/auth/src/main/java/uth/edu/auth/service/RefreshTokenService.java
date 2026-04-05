package uth.edu.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import uth.edu.auth.model.RefreshToken;
import uth.edu.auth.model.User;
import uth.edu.auth.repository.UserRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class RefreshTokenService {
    @Value("${uth.app.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private UserRepository userRepository;

    private static final String REFRESH_TOKEN_PREFIX = "auth:refresh:";
    private static final String USER_TOKEN_PREFIX = "auth:user_refresh:";

    public Optional<RefreshToken> findByToken(String token) {
        String userIdStr = (String) redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + token);
        if (userIdStr == null) return Optional.empty();

        return userRepository.findById(UUID.fromString(userIdStr)).map(user -> {
            RefreshToken rt = new RefreshToken();
            rt.setToken(token);
            rt.setUser(user);
            rt.setExpiryDate(Instant.now().plusMillis(60000)); // Dummy for compatibility
            return rt;
        });
    }

    public RefreshToken createRefreshToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                REFRESH_TOKEN_PREFIX + token,
                userId.toString(),
                refreshTokenDurationMs,
                TimeUnit.MILLISECONDS
        );
        String oldToken = (String) redisTemplate.opsForValue().get(USER_TOKEN_PREFIX + userId);
        if (oldToken != null) {
            redisTemplate.delete(REFRESH_TOKEN_PREFIX + oldToken);
        }
        redisTemplate.opsForValue().set(USER_TOKEN_PREFIX + userId, token, refreshTokenDurationMs, TimeUnit.MILLISECONDS);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User!"));
                
        RefreshToken rt = new RefreshToken();
        rt.setToken(token);
        rt.setUser(user);
        rt.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        return rt;
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        return token;
    }

    public void revokeRefreshToken(String token) {
        String userId = (String) redisTemplate.opsForValue().get(REFRESH_TOKEN_PREFIX + token);
        if (userId != null) {
            redisTemplate.delete(USER_TOKEN_PREFIX + userId);
        }
        redisTemplate.delete(REFRESH_TOKEN_PREFIX + token);
    }
}
package uth.edu.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import uth.edu.auth.security.JwtProvider;

import java.util.concurrent.TimeUnit;

@Service
public class TokenBlacklistService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private JwtProvider jwtProvider;

    private static final String BLACKLIST_PREFIX = "auth:blacklist:";

    /**
     * Thêm token vào blacklist trong Redis với thời gian sống (TTL) tự động tính toán.
     *
     * @param token Access Token cần vô hiệu hóa.
     */
    public void blacklistToken(String token) {
        if (jwtProvider.validateJwtToken(token)) {
            long expiryTime = jwtProvider.getExpirationDateFromToken(token).getTime();
            long now = System.currentTimeMillis();
            long durationMs = expiryTime - now;

            if (durationMs > 0) {
                redisTemplate.opsForValue().set(
                        BLACKLIST_PREFIX + token,
                        "true",
                        durationMs,
                        TimeUnit.MILLISECONDS
                );
            }
        }
    }

    /**
     * Kiểm tra xem token có nằm trong blacklist hay không.
     *
     * @param token Access Token cần kiểm tra.
     * @return true nếu nằm trong blacklist.
     */
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + token));
    }
}

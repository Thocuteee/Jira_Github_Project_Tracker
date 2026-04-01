package uth.edu.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import uth.edu.auth.model.RefreshToken;
import uth.edu.auth.repository.RefreshTokenRepository;
import uth.edu.auth.repository.UserRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {
    @Value("${uth.app.jwtRefreshExpirationMs}")
    private Long refreshTokenDurationMs;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(UUID userId) {
        RefreshToken refreshToken = new RefreshToken();
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy User!"));

        // Mỗi user chỉ giữ 1 refresh token hiện tại.
        refreshTokenRepository.deleteByUser(user);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        refreshToken = refreshTokenRepository.save(refreshToken);
        return refreshToken;
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token đã hết hạn!");
        }
        return token;
    }

    @Transactional
    public boolean revokeRefreshToken(String token) {
        return refreshTokenRepository.deleteByToken(token) > 0;
    }
}
package uth.edu.notification.service.impl;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.notification.model.FcmToken;
import uth.edu.notification.repository.FcmTokenRepository;
import uth.edu.notification.service.IFcmTokenService;

@Service
@RequiredArgsConstructor
public class FcmTokenServiceImpl implements IFcmTokenService {
    private final FcmTokenRepository fcmTokenRepository;

    @Override
    @Transactional
    public void registerToken(UUID userId, String token) {
        if (userId == null || !StringUtils.hasText(token)) {
            return;
        }

        String normalizedToken = token.trim();
        fcmTokenRepository.findByToken(normalizedToken).ifPresentOrElse(
            existing -> {
                if (!Objects.equals(existing.getUserId(), userId)) {
                    existing.setUserId(userId);
                    fcmTokenRepository.save(existing);
                }
            },
            () -> {
                FcmToken fcmToken = FcmToken.builder()
                    .userId(userId)
                    .token(normalizedToken)
                    .build();
                fcmTokenRepository.save(fcmToken);
            }
        );
    }

    @Override
    @Transactional
    public void unregisterToken(UUID userId, String token) {
        if (userId == null || !StringUtils.hasText(token)) {
            return;
        }
        fcmTokenRepository.deleteByUserIdAndToken(userId, token.trim());
    }

    @Override
    public List<String> getTokensByUserId(UUID userId) {
        return fcmTokenRepository.findByUserId(userId)
            .stream()
            .map(FcmToken::getToken)
            .toList();
    }

    @Override
    @Transactional
    public void removeInvalidToken(String token) {
        if (!StringUtils.hasText(token)) {
            return;
        }
        fcmTokenRepository.deleteByToken(token.trim());
    }
}

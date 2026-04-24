package uth.edu.notification.service.impl;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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
        fcmTokenRepository.findByToken(token).ifPresentOrElse(
            existing -> {
                existing.setUserId(userId);
                fcmTokenRepository.save(existing);
            },
            () -> {
                FcmToken fcmToken = FcmToken.builder()
                    .userId(userId)
                    .token(token)
                    .build();
                fcmTokenRepository.save(fcmToken);
            }
        );
    }

    @Override
    @Transactional
    public void unregisterToken(UUID userId, String token) {
        fcmTokenRepository.deleteByUserIdAndToken(userId, token);
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
        fcmTokenRepository.deleteByToken(token);
    }
}

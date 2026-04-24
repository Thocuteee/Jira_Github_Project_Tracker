package uth.edu.notification.service;

import java.util.List;
import java.util.UUID;

public interface IFcmTokenService {
    void registerToken(UUID userId, String token);

    void unregisterToken(UUID userId, String token);

    List<String> getTokensByUserId(UUID userId);

    void removeInvalidToken(String token);
}

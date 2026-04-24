package uth.edu.notification.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uth.edu.notification.model.FcmToken;

@Repository
public interface FcmTokenRepository extends JpaRepository<FcmToken, UUID> {
    List<FcmToken> findByUserId(UUID userId);

    Optional<FcmToken> findByToken(String token);

    void deleteByUserIdAndToken(UUID userId, String token);

    void deleteByToken(String token);
}

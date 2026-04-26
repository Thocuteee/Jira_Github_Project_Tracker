package uth.edu.notification.service;

import java.util.Optional;
import java.util.UUID;

public interface IUserDirectoryService {
    Optional<String> findEmailByUserId(UUID userId, String authToken);
    Optional<String> findDisplayNameByUserId(UUID userId, String authToken);
}

package uth.edu.github.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.github.model.Integration;
import java.util.Optional;
import java.util.UUID;

public interface IntegrationRepo extends JpaRepository<Integration, UUID> {
    Optional<Integration> findByGroupId(UUID groupId);
}
package uth.edu.github.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.github.model.GithubRepository;
import java.util.List;
import java.util.UUID;

public interface GithubRepositoryRepo extends JpaRepository<GithubRepository, UUID> {
    List<GithubRepository> findByGroupId(UUID groupId);
}
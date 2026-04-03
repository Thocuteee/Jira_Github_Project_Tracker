package uth.edu.github.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.github.model.GithubCommit;
import java.util.List;
import java.util.UUID;

public interface GithubCommitRepo extends JpaRepository<GithubCommit, UUID> {
    List<GithubCommit> findByRepo_RepoId(UUID repoId);
    List<GithubCommit> findByGroupId(UUID groupId);
    List<GithubCommit> findByUserId(UUID userId);
}
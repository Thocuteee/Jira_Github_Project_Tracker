package uth.edu.jira.repository;

import uth.edu.jira.model.Jira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface JiraRepository extends JpaRepository<Jira, UUID> {
    List<Jira> findByGroupId(UUID groupId);
    List<Jira> findByUserId(UUID userId);
    Optional<Jira> findByGroupIdAndProjectKey(UUID groupId, String projectKey);
}
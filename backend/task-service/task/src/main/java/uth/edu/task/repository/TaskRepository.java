package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uth.edu.task.model.Task;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByRequirementId(UUID requirementId);

    List<Task> findByAssignedTo(UUID userId);

    List<Task> findByRequirementIdAndAssignedTo(UUID requirementId, UUID userId);

    List<Task> findByGroupId(UUID groupId);

    List<Task> findByGroupIdAndAssignedTo(UUID groupId, UUID userId);

    boolean existsByJiraIssueKey(String jiraIssueKey);
}

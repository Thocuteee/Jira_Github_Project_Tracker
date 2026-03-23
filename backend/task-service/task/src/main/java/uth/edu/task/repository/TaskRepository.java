package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uth.edu.task.model.Task;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByRequirementId(String requirementId);

    List<Task> findByAssignedTo(String userId);

    List<Task> findByRequirementIdAndAssignedTo(String requirementId, String userId);
}

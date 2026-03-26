package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.task.model.TaskHistory;

import java.util.List;
import java.util.UUID;

public interface TaskHistoryRepository extends JpaRepository<TaskHistory, UUID> {

    List<TaskHistory> findByTask_TaskIdOrderByChangedAtDesc(UUID taskId);

    void deleteAllByTask_TaskId(UUID taskId);

}

package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.task.model.TaskComment;

import java.util.List;
import java.util.UUID;

public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

    List<TaskComment> findByTask_TaskIdOrderByCreatedAtDesc(UUID taskId);

    void deleteAllByTask_TaskId(UUID taskId);

}

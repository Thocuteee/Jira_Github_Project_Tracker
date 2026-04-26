package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.task.model.TaskComment;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

    List<TaskComment> findByTask_TaskIdOrderByCreatedAtDesc(UUID taskId);

    @Query("SELECT c FROM TaskComment c WHERE c.task.taskId IN :taskIds ORDER BY c.task.taskId ASC, c.createdAt ASC")
    List<TaskComment> findByTask_TaskIdInOrderByTaskAndCreated(@Param("taskIds") Collection<UUID> taskIds);

    void deleteAllByTask_TaskId(UUID taskId);

}

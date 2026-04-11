package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.task.model.Attachment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByTask_TaskId(UUID taskId);

    Optional<Attachment> findByIdAndTaskId(UUID id, UUID taskId);

    void deleteAllByTask_TaskId(UUID taskId);

}

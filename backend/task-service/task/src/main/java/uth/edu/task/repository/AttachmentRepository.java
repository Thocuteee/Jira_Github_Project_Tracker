package uth.edu.task.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uth.edu.task.model.Attachment;

import java.util.List;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByTask_TaskId(UUID taskId);

    void deleteAllByTask_TaskId(UUID taskId);

}

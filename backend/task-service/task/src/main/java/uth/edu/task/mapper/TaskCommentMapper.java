package uth.edu.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;
import uth.edu.task.model.TaskComment;


@Mapper(componentModel = "spring")
public interface TaskCommentMapper {

    TaskComment toEntity(TaskCommentRequest request);

    @Mapping(source = "task.taskId", target = "taskId")
    TaskCommentResponse toResponse(TaskComment taskComment);

    void updateEntityFromRequest(TaskCommentRequest request, @MappingTarget TaskComment taskComment);
}

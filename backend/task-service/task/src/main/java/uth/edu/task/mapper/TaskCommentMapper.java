package uth.edu.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import uth.edu.task.dto.request.TaskCommentRequest;
import uth.edu.task.dto.response.TaskCommentResponse;
import uth.edu.task.model.TaskComment;


@Mapper(componentModel = "spring")
public interface TaskCommentMapper {

    // Chuyển từ Request sang Entity
    TaskComment toEntity(TaskCommentRequest taskCommentRequest);

    // Chuyển từ Entity sang Response
    TaskCommentResponse toResponse(TaskComment taskComment);

    // Cập nhật dữ liệu từ Request vào Entity có sẵn
    void updateEntityFromRequest(TaskCommentRequest request, @MappingTarget TaskComment attachment);
}

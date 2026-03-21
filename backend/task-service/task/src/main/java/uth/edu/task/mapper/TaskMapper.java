package uth.edu.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import uth.edu.task.dto.request.TaskRequest;
import uth.edu.task.dto.response.TaskResponse;
import uth.edu.task.model.Task;

@Mapper(componentModel = "spring")
public interface TaskMapper {
    // 1. Chuyển từ Request sang Entity
    Task toEntity(TaskRequest request);

    // 2. Chuyển từ Entity sang Response
    TaskResponse toResponse(Task task);

    // 3. Cập nhật dữ liệu từ Request vào Entity có sẵn
    void updateEntityFromRequest(TaskRequest request, @MappingTarget Task task);
}

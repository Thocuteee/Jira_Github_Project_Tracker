package uth.edu.task.mapper;

import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.dto.response.TaskResponse;
import uth.edu.task.model.Task;

@Mapper(componentModel = "spring")
public interface TaskMapper {
    // Chuyển từ Request sang Entity
    Task toEntity(TaskCreateRequest request);

    // Chuyển từ Entity sang Response
    TaskResponse toResponse(Task task);

    // Cập nhật dữ liệu từ Request vào Entity có sẵn
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(TaskUpdateRequest request, @MappingTarget Task task);
}

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

    Task toEntity(TaskCreateRequest request);

    TaskResponse toResponse(Task task);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(TaskUpdateRequest request, @MappingTarget Task task);
}

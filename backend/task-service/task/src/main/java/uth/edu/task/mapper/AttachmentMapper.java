package uth.edu.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import uth.edu.task.dto.request.AttachmentCreateRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.model.Attachment;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    @Mapping(target = "attachmentId", ignore = true)
    @Mapping(target = "task", ignore = true)
    @Mapping(target = "uploadedBy", ignore = true)
    @Mapping(target = "uploadedAt", ignore = true)
    Attachment toEntity(AttachmentCreateRequest request);

    @Mapping(source = "task.taskId", target = "taskId")
    AttachmentResponse toResponse(Attachment attachment);

}

package uth.edu.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import uth.edu.task.dto.request.AttachmentRequest;
import uth.edu.task.dto.response.AttachmentResponse;
import uth.edu.task.model.Attachment;

@Mapper(componentModel = "spring")
public interface AttachmentMapper {

    // Chuyển từ Request sang Entity
    Attachment toEntity(AttachmentRequest attachmentRequest);

    // Chuyển từ Entity sang Response
    AttachmentResponse toResponse(Attachment attachment);

    // Cập nhật dữ liệu từ Request vào Entity có sẵn
    void updateEntityFromRequest(AttachmentRequest request, @MappingTarget Attachment attachment);
}

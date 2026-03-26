package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttachmentCreateRequest {

    @NotBlank(message = "File Key không được để trống!")
    private String fileKey;

    @NotBlank(message = "Tên file không được để trống!")
    private String fileName;

    @NotBlank(message = "URL lưu trữ file không được để trống!")
    private String fileUrl;

}

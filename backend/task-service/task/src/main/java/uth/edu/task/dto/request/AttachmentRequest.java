package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttachmentRequest {
    @NotBlank(message = "Tên file không được để trống")
    private String fileName;

    @NotBlank(message = "Đường dẫn file không được để trống")
    private String fileUrl;
}

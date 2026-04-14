package uth.edu.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateUrlRequest {

    @NotBlank(message = "Tên file không được để trống!")
    private String fileName;

    @NotBlank(message = "Định dạng file không được để trống!")
    private String contentType;
}

package uth.edu.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRequestDTO {

    @NotNull(message = "groupId is required")
    private UUID groupId;

    @NotNull(message = "reportIdUser is required")
    private UUID reportIdUser;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "reportType is required")
    private String reportType;

    @NotNull(message = "generatedBy is required")
    private UUID generatedBy;
}
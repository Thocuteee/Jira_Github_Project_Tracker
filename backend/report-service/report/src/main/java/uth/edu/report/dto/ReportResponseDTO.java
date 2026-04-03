package uth.edu.report.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponseDTO {

    private UUID reportId;
    private UUID groupId;
    private UUID reportIdUser;
    private String title;
    private String reportType;
    private UUID generatedBy;
    private LocalDateTime createdAt;
}
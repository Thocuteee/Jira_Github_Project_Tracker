package uth.edu.export.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportNotificationEvent {
    private UUID userId;
    private String fileName;
    private String fileUrl;
    private String message;
}

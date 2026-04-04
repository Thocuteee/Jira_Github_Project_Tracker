package uth.edu.export.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExportNotification {
    private UUID groupId;
    private String fileUrl;
    private String message;
}
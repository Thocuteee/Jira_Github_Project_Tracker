package uth.edu.export.dto.request;

import lombok.Data;
import java.util.UUID;

@Data

public class ExportDocumentRequest {
    private UUID groupId;
    private String fileType; // pdf hoac docx
    private UUID requestedBy; // ID nguoi yeu cau xuat file
}

package uth.edu.export.dto.request;

import lombok.Data;
import java.util.UUID;
import java.util.List;

@Data

public class ExportDocumentRequest {
    private UUID groupId;
    private String fileType; // pdf hoac docx
    private String documentName;
    private UUID requestedBy; // ID nguoi yeu cau xuat file
    private List<UUID> requirementIds; // Optional list of specific requirements to export
    private Boolean includeCompletedOnly;
    private Boolean includeTasks;
    private Boolean includeComments;
    private Boolean includeProgress;
}

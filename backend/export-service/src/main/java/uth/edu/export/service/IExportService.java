package uth.edu.export.service;

import java.util.List;
import java.util.UUID;

import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.dto.request.ExportDocumentRequest;

public interface IExportService {

    List<ExportResponse> getExportsByGroupId(UUID groupId);

    /** @param authorizationHeader giá trị header Authorization từ request gốc (Bearer), chuyển tiếp cho file-service qua Feign. */
    String processExportRequest(ExportDocumentRequest request, String authorizationHeader);
}
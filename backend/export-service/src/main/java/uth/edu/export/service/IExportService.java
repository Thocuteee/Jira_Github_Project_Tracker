package uth.edu.export.service;

import java.util.List;
import java.util.UUID;

import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.dto.request.ExportDocumentRequest;

public interface IExportService {

    List<ExportResponse> getExportsByGroupId(UUID groupId);

    String processExportRequest(ExportDocumentRequest request); // tra ve exportId (UUID) de client sau nay co the check trang thai export
}
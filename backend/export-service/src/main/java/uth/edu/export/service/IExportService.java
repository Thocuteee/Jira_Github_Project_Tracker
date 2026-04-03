package uth.edu.export.service;

import java.util.List;

import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.dto.request.ExportDocumentRequest;

public interface IExportService {
    
    List<ExportResponse> getAllExports();
    String processExportRequest(ExportDocumentRequest request); // tra ve exportId (UUID) de client sau nay co the check trang thai export
}
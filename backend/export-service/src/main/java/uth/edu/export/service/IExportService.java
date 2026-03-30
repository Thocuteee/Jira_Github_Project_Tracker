package uth.edu.export.service;

import java.util.List;

import uth.edu.export.dto.response.ExportResponse;

public interface IExportService {
    
    List<ExportResponse> getAllExports();
}
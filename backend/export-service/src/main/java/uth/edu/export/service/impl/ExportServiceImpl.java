package uth.edu.export.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.service.IExportService;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements IExportService {

    private final ExportSRSRepository exportRepository;

    @Override
    public List<ExportResponse> getAllExports() {
        // lay du lieu tu database va chuyen doi sang ExportResponse (chua lam)
        return List.of(); 
    }
}
package uth.edu.export.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.dto.response.ExportResponse;
import uth.edu.export.model.ExportSRS;
import uth.edu.export.model.ExportStatus;
import uth.edu.export.model.FileType;     
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.service.IExportService;

@Service
@RequiredArgsConstructor
public class ExportServiceImpl implements IExportService {

    private final ExportSRSRepository exportRepository;
    // goi ExportAsyncService de chay ngam xu ly viec tao file va upload len Cloud Storage, sau do update database, de khong can cho client phai doi cho xong moi tra ve ket qua, nhung van co the tra ve ngay Export ID de client theo doi trang thai sau do
    private final ExportAsyncService exportAsyncService; 

    @Override
    public List<ExportResponse> getAllExports() {
        // lay tat ca export tu database
        List<ExportSRS> listExports = exportRepository.findAll();

        // chuyen doi tu ExportSRS sang ExportResponse de tra ve cho client, o day cung ep kieu Enum sang String de client de doc hon va tranh loi sai xau code khi client nhap sai fileType hay status
        return listExports.stream().map(export -> 
            ExportResponse.builder()
                .exportId(export.getExportId())
                .groupId(export.getGroupId())
                .version(export.getVersion())
                .fileName(export.getFileName())
                .fileUrl(export.getFileUrl())
                // ep kieu Enum sang String, neu export.getFileType() khac null thi lay name() cua enum de tra ve String, neu null thi tra ve null
                .fileType(export.getFileType() != null ? export.getFileType().name() : null) 
                .status(export.getStatus() != null ? export.getStatus().name() : null)
                .generatedBy(export.getGeneratedBy() != null ? export.getGeneratedBy().toString() : null)
                .createdAt(export.getCreatedAt())
                .build()
        ).toList();
    }
    
    @Override
    public String processExportRequest(ExportDocumentRequest request) {
    
        ExportSRS newExport = ExportSRS.builder()
                .groupId(request.getGroupId())
                // enum FileType se tu dong convert tu String request.getFileType() (vd: "pdf") sang FileType.PDF
                .fileType(FileType.valueOf(request.getFileType().toUpperCase())) 
                // Ở đây requirementSnapshot tạm thời để null, sau này có thể update lại thành snapshot thật của requirement group khi client gửi lên
                .status(ExportStatus.PENDING) 
                .createdAt(LocalDateTime.now())
                .build();
        
        ExportSRS savedExport = exportRepository.save(newExport);

        // goi ham generateDocumentAsync() de chay ngam xu ly viec tao file va upload len Cloud Storage, sau do update database, de khong can cho client phai doi cho xong moi tra ve ket qua, nhung van co the tra ve ngay Export ID de client theo doi trang thai sau do
        exportAsyncService.generateDocumentAsync(savedExport.getExportId(), request);

        return savedExport.getExportId().toString();
    }
}
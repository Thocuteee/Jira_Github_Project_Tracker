package uth.edu.export.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.service.IExportService;
import uth.edu.export.dto.response.ExportResponse;
import java.util.List;

import java.util.Map;
import uth.edu.export.service.IDocumentGeneratorService;
import uth.edu.export.client.RequirementClient;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {

    private final IExportService exportService;
    private final IDocumentGeneratorService documentGeneratorService;
    private final RequirementClient requirementClient;

    // API endpoint de client goi khi muon xuat file, tra ve exportId de client sau nay check trang thai export
    @PostMapping("/generate")
    public ResponseEntity<Object> generateDocument(@RequestBody ExportDocumentRequest request) {
        // goi service de xu ly yeu cau xuat file, tra ve exportId (UUID) de client sau nay co the check trang thai export
        String exportId = exportService.processExportRequest(request);

        // tra ve 202 Accepted va exportId
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
            "message", "Đang tạo file",
            "exportId", exportId
        ));
    }

    // API lay danh sach tai lieu da xuat, client co the goi API nay de hien thi lich su tai lieu da xuat
    @GetMapping
    public ResponseEntity<List<uth.edu.export.dto.response.ExportResponse>> getAllExports() {
        return ResponseEntity.ok(exportService.getAllExports());
    }

    @PostMapping("/srs")
    public ResponseEntity<byte[]> exportSrs(@RequestBody ExportDocumentRequest request) {
        String requirementData;
        
        if (request.getRequirementIds() != null && !request.getRequirementIds().isEmpty()) {
            requirementData = requirementClient.getRequirementsByIds(request.getRequirementIds());
        } else if (request.getGroupId() != null) {
            requirementData = requirementClient.getRequirementsByGroupId(request.getGroupId());
        } else {
            return ResponseEntity.badRequest().body("GroupId hoặc RequirementIds là bắt buộc".getBytes());
        }
        
        byte[] content = documentGeneratorService.generateDocument(requirementData, request.getFileType());
        
        String mimeType = request.getFileType().equalsIgnoreCase("PDF") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        String extension = request.getFileType().toLowerCase();
        
        return ResponseEntity.ok()
                .header("Content-Type", mimeType)
                .header("Content-Disposition", "attachment; filename=SRS_Report." + extension)
                .body(content);
    }
}
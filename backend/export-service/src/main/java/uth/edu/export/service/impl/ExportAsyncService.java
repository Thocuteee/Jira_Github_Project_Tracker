package uth.edu.export.service.impl;

import java.util.UUID;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.model.ExportStatus;
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.client.RequirementClient;
import uth.edu.export.service.IDocumentGeneratorService;
import uth.edu.export.service.ICloudStorageService;

@Slf4j // dung de log thong tin trong qua trinh chay background job, de de dang theo doi va debug neu co loi xay ra
@Service
@RequiredArgsConstructor
public class ExportAsyncService {

    private final ExportSRSRepository exportRepository;
    private final RequirementClient requirementClient;
    private final IDocumentGeneratorService documentGeneratorService;
    private final ICloudStorageService cloudStorageService;
    // tam thoi chua lam Message Broker
    // private final MessageBrokerService messageBrokerService; 

    @Async
    public void generateDocumentAsync(UUID exportId, ExportDocumentRequest request) {
        log.info("[BACKGROUND JOB] Bat dau xu ly Export ID: {}", exportId);
        
        try {
            // lay du lieu tu Requirement Service (tra ve JSON)
            String requirementDataJson = requirementClient.getRequirementsByGroupId(request.getGroupId());
            log.info("Da lay du lieu Requirement cho Group: {}", request.getGroupId());

            // co the luu snapshot requirementDataJson nay vao database
            
            // Generate File (HTML -> PDF/DOCX)
            byte[] fileData = documentGeneratorService.generateDocument(requirementDataJson, request.getFileType());
            log.info("Da generate xong file {}", request.getFileType());

            // upload file len Cloud Storage va lay URL tra ve
            String publicFileUrl = cloudStorageService.uploadFile(fileData, exportId, request.getFileType());
            log.info("Da upload file thanh cong: {}", publicFileUrl);

            // cap nhat databse
            exportRepository.findById(exportId).ifPresent(export -> {
                export.setRequirementSnapshot(requirementDataJson); // luu lai snapshot
                export.setStatus(ExportStatus.DONE);
                export.setFileUrl(publicFileUrl);
                export.setNote("Tai lieu da duoc tao!");
                exportRepository.save(export);
            });

            // ban su kien sang Message Broker (Kafka/RabbitMQ) cho Notification Service
            // messageBrokerService.publishExportDoneEvent(request.getGroupId(), publicFileUrl);
            log.info("[BACKGROUND JOB] Hoan tat 100% cho Export ID: {}", exportId);

        } catch (Exception e) {
            log.error("Loi trong qua trinh chay ngam Export ID {}: {}", exportId, e.getMessage());
            // cap nhat trang thai loi vao database de client biet va hien thi thong tin loi
            exportRepository.findById(exportId).ifPresent(export -> {
                export.setStatus(ExportStatus.FAILED);
                export.setNote("Loi: " + e.getMessage());
                exportRepository.save(export);
            });
        }
    }
}


package uth.edu.export.service.impl;

import java.util.UUID;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import uth.edu.export.dto.ExportNotification;
import uth.edu.export.dto.request.ExportDocumentRequest;
import uth.edu.export.model.ExportStatus;
import uth.edu.export.repository.ExportSRSRepository;
import uth.edu.export.client.RequirementClient;
import uth.edu.export.service.IDocumentGeneratorService;
import uth.edu.export.service.ICloudStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Slf4j // dung de log thong tin trong qua trinh chay background job, de de dang theo doi va debug neu co loi xay ra
@Service
@RequiredArgsConstructor
public class ExportAsyncService {

    private final ExportSRSRepository exportRepository;
    private final RequirementClient requirementClient;
    private final IDocumentGeneratorService documentGeneratorService;
    private final ICloudStorageService cloudStorageService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange.name}")
    private String exchange;

    @Value("${rabbitmq.routing.key}")
    private String routingKey;

    @Async
    public void generateDocumentAsync(UUID exportId, ExportDocumentRequest request) {
        log.info("Bat dau xu ly Export ID: {}", exportId);
        
        try {
            // lay du lieu tu Requirement Service (tra ve JSON)
            String requirementDataJson;
            try {
                requirementDataJson = requirementClient.getRequirementsByGroupId(request.getGroupId());
                log.info("Da lay du lieu tu 8082 cho Group: {}", request.getGroupId());
            } catch (Exception feignError) {
                log.warn("Loi ket noi Requirement Service 8083. Dung du lieu gia de test luong Export & RabbitMQ!");
                requirementDataJson = "[{\"reqId\":\"1\", \"title\":\"Chức năng Đăng nhập (Test)\"}, {\"reqId\":\"2\", \"title\":\"Chức năng Export (Test)\"}]";
            }

            // co the luu snapshot requirementDataJson nay vao database
            
            // Generate File (HTML -> PDF/DOCX)
            byte[] fileData = documentGeneratorService.generateDocument(requirementDataJson, request.getFileType());
            log.info("Da generate xong file {}", request.getFileType());

            // upload file len Cloud Storage va lay URL tra ve
            String publicFileUrl = cloudStorageService.uploadFile(fileData, exportId, request.getFileType());
            log.info("Da upload file thanh cong: {}", publicFileUrl);

            final String finalRequirementDataJson = requirementDataJson;

            // cap nhat databse
            exportRepository.findById(exportId).ifPresent(export -> {
                export.setRequirementSnapshot(finalRequirementDataJson); // luu lai snapshot
                export.setStatus(ExportStatus.DONE);
                export.setFileUrl(publicFileUrl);
                export.setNote("Tai lieu da duoc tao!");
                exportRepository.save(export);
            });

            // ban su kien sang Message Broker (Kafka/RabbitMQ) cho Notification Service
            log.info("Bat dau ban thong bao sang RabbitMQ cho Notification Service...");

            ExportNotification notification = new ExportNotification(
                request.getGroupId(), 
                publicFileUrl,
                "Tai lieu SRS da duoc tai ve!"
            );

            // nem message sang RabbitMQ, de Notification Service nhan duoc va gui thong bao cho user
            rabbitTemplate.convertAndSend(exchange, routingKey, notification);
            
            log.info("Da gui tin nhan sang RabbitMQ thanh cong! Link: {}", publicFileUrl);
            log.info("Hoan tat 100% cho Export ID: {}", exportId);

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


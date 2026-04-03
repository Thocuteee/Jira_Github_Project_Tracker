package uth.edu.export.service.impl;

import org.springframework.stereotype.Service;
import uth.edu.export.service.IDocumentGeneratorService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class DocumentGeneratorServiceImpl implements IDocumentGeneratorService {

    @Override
    public byte[] generateDocument(String requirementDataJson, String fileType) {
        log.info("Bat dau tao file {}", fileType);
        
        try {
            // tam thoi gia lap tao file mat 3s
            Thread.sleep(3000);
            
            // Thymeleaf và OpenPDF thì viết code sinh file thật ở đây
            String dummyContent = "Day la noi dung gia lap cua file " + fileType;
            return dummyContent.getBytes(); // tra ve mang byte cua file de upload len cloud storage

        } catch (InterruptedException e) {
            log.error("Loi khi generate document", e);
            throw new RuntimeException("Khong the tao file document", e);
        }
    }
}
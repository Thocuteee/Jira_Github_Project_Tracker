package uth.edu.export.service.impl;

import org.springframework.stereotype.Service;
import uth.edu.export.service.ICloudStorageService;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Slf4j
@Service
public class CloudStorageServiceImpl implements ICloudStorageService {

    @Override
    public String uploadFile(byte[] fileData, UUID exportId, String fileType) {
        log.info("Bat dau upload file len Cloud Storage...");
        
        try {
            // gia lap viec ban file len AWS S3 mat 2s
            Thread.sleep(2000);
            
            // TODO: gan thuc upload file len AWS S3 o day, sau do tra ve URL public cua file da upload
            String publicUrl = "https://aws-s3-dummy.com/files/" + exportId + "." + fileType.toLowerCase();
            log.info("Upload thanh cong! Link tai: {}", publicUrl);
            
            return publicUrl;

        } catch (InterruptedException e) {
            log.error("Loi khi upload Cloud", e);
            throw new RuntimeException("Khong the upload file len Cloud", e);
        }
    }
}
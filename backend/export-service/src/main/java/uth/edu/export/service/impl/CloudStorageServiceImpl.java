package uth.edu.export.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import uth.edu.export.service.ICloudStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor 
public class CloudStorageServiceImpl implements ICloudStorageService {

    private final S3Client s3Client;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    @Value("${cloudflare.r2.public-domain}")
    private String publicDomain;

    @Override
    public String uploadFile(byte[] fileData, UUID exportId, String fileType) {
        log.info("Bat dau upload file bao cao len Cloudflare R2...");
        
        try {
            // dat ten file: exports/{exportId}.pdf (hoac .docx)
            String fileName = "exports/" + exportId.toString() + "." + fileType.toLowerCase();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(fileType.equalsIgnoreCase("PDF") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileData));
            
            // Su dung public domain tu cau hinh
            String publicUrl = String.format("%s/%s", publicDomain, fileName);
            
            log.info("Upload thanh cong! Link tai: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Loi khi upload file len Cloud", e);
            throw new RuntimeException("Khong the upload file len Cloud", e);
        }
    }
}
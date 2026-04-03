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

    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Override
    public String uploadFile(byte[] fileData, UUID exportId, String fileType) {
        log.info("Bat dau upload file len MinIO...");
        
        try {
            // dat ten file tren MinIO theo format: exports/{exportId}.pdf (hoac .docx sau nay neu co)
            String fileName = "exports/" + exportId.toString() + "." + fileType.toLowerCase();

            // khoi tao yeu cau tai file len MinIO, dat content type de MinIO biet dang file va xu ly dung cach (PDF hoac DOCX)
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(fileName)
                    .contentType(fileType.equalsIgnoreCase("PDF") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    .build();

            // thuc thi mang byte upload len MinIO
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileData));
            
            // tao URL public de tai file ve
            String publicUrl = "http://localhost:9000/" + bucketName + "/" + fileName;
            
            log.info("Upload thanh cong! Link tai o day: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("Loi khi upload file len Cloud", e);
            throw new RuntimeException("Khong the upload file len Cloud", e);
        }
    }
}
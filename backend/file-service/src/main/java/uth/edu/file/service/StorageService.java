package uth.edu.file.service;

import uth.edu.file.dto.PresignedUrlDto;

import java.time.Duration;

public interface StorageService {
    
    PresignedUrlDto generatePresignedUploadUrl(String fileKey, String contentType, Duration expiration);
    
    String generatePresignedDownloadUrl(String fileKey, Duration expiration);
    
    void deleteFile(String fileKey);
    
    String getPublicUrl(String fileKey);
}

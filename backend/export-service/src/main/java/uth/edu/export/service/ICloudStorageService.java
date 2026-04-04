package uth.edu.export.service;

import java.util.UUID;

public interface ICloudStorageService {
    String uploadFile(byte[] fileData, UUID exportId, String fileType);
}
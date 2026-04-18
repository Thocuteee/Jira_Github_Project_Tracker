package uth.edu.task.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import uth.edu.task.dto.response.file.PresignedUrlResponse;

import java.util.UUID;

@FeignClient(name = "file-service", url = "${app.file-service.url:http://file-service:8090}")
public interface FileServiceClient {

    @GetMapping("/api/files/presigned-upload")
    PresignedUrlResponse getUploadUrl(
            @RequestParam("fileName") String fileName,
            @RequestParam("contentType") String contentType,
            @RequestParam("scope") String scope,
            @RequestParam("referenceId") String referenceId);

    @DeleteMapping("/api/files/{fileKey}")
    void deleteFile(@PathVariable("fileKey") String fileKey);

    @DeleteMapping("/api/files/reference/{referenceId}")
    void deleteFilesByReference(
            @PathVariable("referenceId") String referenceId,
            @RequestParam("scope") String scope);
}

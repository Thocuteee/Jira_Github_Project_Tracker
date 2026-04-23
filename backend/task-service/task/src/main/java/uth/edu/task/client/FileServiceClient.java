package uth.edu.task.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import uth.edu.task.dto.response.file.FileRecordResponse;

@FeignClient(name = "file-service", url = "${app.file-service.url:http://file-service:8090}")
public interface FileServiceClient {

    @PostMapping(value = "/api/files/upload", consumes = "multipart/form-data")
    FileRecordResponse uploadFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam("referenceId") String referenceId,
            @RequestParam("scope") String scope);

    @DeleteMapping("/api/files")
    void deleteFile(@RequestParam("fileKey") String fileKey);

    @DeleteMapping("/api/files/reference/{referenceId}")
    void deleteFilesByReference(
            @PathVariable("referenceId") String referenceId,
            @RequestParam("scope") String scope);
}

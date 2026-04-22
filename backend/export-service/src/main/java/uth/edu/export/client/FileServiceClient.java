package uth.edu.export.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import uth.edu.export.dto.response.FileRecordResponse;

@FeignClient(name = "file-service", url = "${app.file-service.url:http://file-service:8090}")
public interface FileServiceClient {

    @PostMapping(value = "/api/files/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FileRecordResponse uploadFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam("referenceId") String referenceId,
            @RequestParam("scope") String scope,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader("X-User-Role") String userRole);
}

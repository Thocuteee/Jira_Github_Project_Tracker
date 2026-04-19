package uth.edu.file.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uth.edu.file.service.FileService;

import java.util.Map;

@RestController
@RequestMapping("/api/files/admin")
@RequiredArgsConstructor
public class AdminFileController {

    private final FileService fileService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(fileService.getAdminStats());
    }
}

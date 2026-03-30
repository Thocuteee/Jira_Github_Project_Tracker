package uth.edu.export.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import uth.edu.export.service.IExportService;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {

    private final IExportService exportService;

    // test thu xem API co hoat dong khong
    @GetMapping("/test")
    public ResponseEntity<String> testExportAPI() {
        return ResponseEntity.ok("Export Service đã lên sóng ngon lành trên cổng 8087!");
    }
}
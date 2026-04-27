package uth.edu.github.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.model.GlobalSetting;
import uth.edu.github.repository.GlobalSettingRepo;

@RestController
@RequestMapping("/api/github/settings")
@RequiredArgsConstructor
public class GlobalSettingController {

    private final GlobalSettingRepo repo;
    private final uth.edu.github.service.GithubMessagePublisher publisher;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(repo.findAll().stream().findFirst().orElse(new GlobalSetting()));
    }

    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody GlobalSetting settings) {
        GlobalSetting existing = repo.findAll().stream().findFirst().orElse(null);
        if (existing != null) {
            settings.setId(existing.getId());
        }
        GlobalSetting saved = repo.save(settings);
        
        // Gửi một thông báo giả qua RabbitMQ để test giao diện Real-time
        try {
            java.util.Map<String, Object> msg = new java.util.HashMap<>();
            msg.put("jiraKey", "SYSTEM");
            msg.put("message", "Đã cập nhật cấu hình hệ thống Jira/GitHub");
            msg.put("url", "#");
            publisher.sendCommitSync(msg);
        } catch (Exception e) {
            System.err.println("Failed to publish system setting event to RabbitMQ");
        }
        
        return ResponseEntity.ok(saved);
    }
}

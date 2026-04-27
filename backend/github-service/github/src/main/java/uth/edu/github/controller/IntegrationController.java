package uth.edu.github.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.dto.IntegrationRequest;
import uth.edu.github.service.IIntegrationService;
import java.util.UUID;

@RestController
@RequestMapping("/api/github/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IIntegrationService service;
    private final uth.edu.github.service.GithubMessagePublisher publisher;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody IntegrationRequest request) {
        Object result = service.create(request);
        
        // Gửi một thông báo giả qua RabbitMQ để test giao diện Real-time
        try {
            java.util.Map<String, Object> msg = new java.util.HashMap<>();
            msg.put("jiraKey", "SYSTEM");
            msg.put("message", "Đã thêm mới một bản ánh xạ Integration (Nhóm - Jira - GitHub)");
            msg.put("url", "#");
            publisher.sendCommitSync(msg);
        } catch (Exception e) {
            System.err.println("Failed to publish integration event to RabbitMQ");
        }
        
        return new ResponseEntity<>(result, HttpStatus.CREATED);
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{integrationId}")
    public ResponseEntity<?> getById(@PathVariable UUID integrationId) {
        return ResponseEntity.ok(service.getById(integrationId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getByGroupId(@PathVariable UUID groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @PutMapping("/{integrationId}")
    public ResponseEntity<?> update(@PathVariable UUID integrationId,
                                    @Valid @RequestBody IntegrationRequest request) {
        return ResponseEntity.ok(service.update(integrationId, request));
    }

    @DeleteMapping("/{integrationId}")
    public ResponseEntity<?> delete(@PathVariable UUID integrationId) {
        service.delete(integrationId);
        return ResponseEntity.ok("Đã xóa Integration thành công!");
    }
}
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

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody IntegrationRequest request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
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
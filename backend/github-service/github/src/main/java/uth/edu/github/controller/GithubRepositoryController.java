package uth.edu.github.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.dto.GithubRepositoryRequest;
import uth.edu.github.service.IGithubRepositoryService;
import java.util.UUID;

@RestController
@RequestMapping("/api/github/repositories")
@RequiredArgsConstructor
public class GithubRepositoryController {

    private final IGithubRepositoryService service;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody GithubRepositoryRequest request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{repoId}")
    public ResponseEntity<?> getById(@PathVariable UUID repoId) {
        return ResponseEntity.ok(service.getById(repoId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getByGroupId(@PathVariable UUID groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @PutMapping("/{repoId}")
    public ResponseEntity<?> update(@PathVariable UUID repoId,
                                    @Valid @RequestBody GithubRepositoryRequest request) {
        return ResponseEntity.ok(service.update(repoId, request));
    }

    @DeleteMapping("/{repoId}")
    public ResponseEntity<?> delete(@PathVariable UUID repoId) {
        service.delete(repoId);
        return ResponseEntity.ok("Đã xóa Repository thành công!");
    }
}
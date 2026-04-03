package uth.edu.github.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.dto.GithubCommitRequest;
import uth.edu.github.service.IGithubCommitService;
import java.util.UUID;

@RestController
@RequestMapping("/api/github/commits")
@RequiredArgsConstructor
public class GithubCommitController {

    private final IGithubCommitService service;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody GithubCommitRequest request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @GetMapping("/{commitId}")
    public ResponseEntity<?> getById(@PathVariable UUID commitId) {
        return ResponseEntity.ok(service.getById(commitId));
    }

    @GetMapping("/repo/{repoId}")
    public ResponseEntity<?> getByRepoId(@PathVariable UUID repoId) {
        return ResponseEntity.ok(service.getByRepoId(repoId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getByGroupId(@PathVariable UUID groupId) {
        return ResponseEntity.ok(service.getByGroupId(groupId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @DeleteMapping("/{commitId}")
    public ResponseEntity<?> delete(@PathVariable UUID commitId) {
        service.delete(commitId);
        return ResponseEntity.ok("Đã xóa Commit thành công!");
    }
}
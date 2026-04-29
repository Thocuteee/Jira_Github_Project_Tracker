package uth.edu.github.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.dto.GithubCommitResponse;
import uth.edu.github.service.IGithubSyncService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/github/sync")
@RequiredArgsConstructor
public class GithubSyncController {

    private final IGithubSyncService syncService;

    @PostMapping("/{groupId}")
    public ResponseEntity<?> syncCommits(@PathVariable UUID groupId) {
        try {
            List<GithubCommitResponse> newCommits = syncService.syncCommitsFromGithub(groupId);
            return ResponseEntity.ok(Map.of(
                    "synced", newCommits.size(),
                    "message", newCommits.isEmpty()
                            ? "Không có commit mới. Dữ liệu đã được đồng bộ trước đó."
                            : "Đã đồng bộ thành công " + newCommits.size() + " commit mới từ GitHub!"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "synced", 0,
                    "message", e.getMessage()
            ));
        }
    }
}

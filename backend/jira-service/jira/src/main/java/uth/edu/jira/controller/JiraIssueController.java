package uth.edu.jira.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.jira.service.JiraIssueService;
import uth.edu.jira.service.JiraConfigService;
import uth.edu.jira.model.JiraSyncActivity;

import java.util.List;

import java.util.UUID;

@RestController
@RequestMapping("/api/jira/issues")
@RequiredArgsConstructor
@Slf4j
public class JiraIssueController {

    private final JiraIssueService jiraIssueService;
    private final JiraConfigService jiraConfigService;

    @GetMapping("/activities")
    public ResponseEntity<List<JiraSyncActivity>> getActivities() {
        return ResponseEntity.ok(jiraConfigService.getRecentActivities());
    }

    @GetMapping("/test-connection")
    public ResponseEntity<Boolean> testConnection(@RequestParam(required = false) UUID jiraId) {
        // If jiraId is provided, we can test that specific one, 
        // otherwise we test the global connection
        return ResponseEntity.ok(jiraConfigService.testConnection(jiraId));
    }

    @PostMapping("/sync")
    public ResponseEntity<String> syncProject(@RequestParam String projectKey, @RequestParam UUID groupId) {
        log.info("Request to sync Jira project for projectKey={} and groupId={}", projectKey, groupId);
        jiraIssueService.syncProjectFromJira(projectKey, groupId);
        return ResponseEntity.ok("Yêu cầu đồng bộ hóa đã được phát sóng thành công.");
    }

    @PostMapping("/mapping")
    public ResponseEntity<uth.edu.jira.dto.JiraResponse> upsertMapping(@RequestParam UUID groupId, @RequestParam String projectKey) {
        return ResponseEntity.ok(jiraConfigService.upsertMapping(groupId, projectKey));
    }

    @PostMapping("/settings")
    public ResponseEntity<String> saveGlobalSettings(@RequestBody uth.edu.jira.dto.GlobalJiraSettingRequest dto) {
        jiraConfigService.saveGlobalSettings(dto);
        return ResponseEntity.ok("Cài đặt Jira hệ thống đã được cập nhật thành công.");
    }
}

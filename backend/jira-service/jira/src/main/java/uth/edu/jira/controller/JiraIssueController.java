package uth.edu.jira.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.jira.dto.JiraIssueRequest;
import uth.edu.jira.dto.JiraIssueResponse;
import uth.edu.jira.service.JiraIssueService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/jira/issues")
@RequiredArgsConstructor
public class JiraIssueController {

    private final JiraIssueService issueService;

    @PostMapping("/sync/{jiraId}")
    public ResponseEntity<List<JiraIssueResponse>> sync(@PathVariable UUID jiraId) {
        return ResponseEntity.ok(issueService.syncIssuesFromJira(jiraId));
    }

    @PostMapping
    public ResponseEntity<JiraIssueResponse> create(@Valid @RequestBody JiraIssueRequest request) {
        return new ResponseEntity<>(issueService.createJiraIssue(request), HttpStatus.CREATED);
    }

    @GetMapping("/{jiraIssueId}")
    public ResponseEntity<JiraIssueResponse> getById(@PathVariable UUID jiraIssueId) {
        return ResponseEntity.ok(issueService.getJiraIssueById(jiraIssueId));
    }

    @GetMapping("/key/{jiraIssueKey}")
    public ResponseEntity<JiraIssueResponse> getByKey(@PathVariable String jiraIssueKey) {
        return ResponseEntity.ok(issueService.getJiraIssueByKey(jiraIssueKey));
    }

    @GetMapping("/jira/{jiraId}")
    public ResponseEntity<List<JiraIssueResponse>> getByJiraId(@PathVariable UUID jiraId) {
        return ResponseEntity.ok(issueService.getIssuesByJiraId(jiraId));
    }

    @GetMapping("/jira/{jiraId}/status/{status}")
    public ResponseEntity<List<JiraIssueResponse>> getByJiraIdAndStatus(
            @PathVariable UUID jiraId,
            @PathVariable String status) {
        return ResponseEntity.ok(issueService.getIssuesByJiraIdAndStatus(jiraId, status));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<JiraIssueResponse>> getByTaskId(@PathVariable UUID taskId) {
        return ResponseEntity.ok(issueService.getIssuesByTaskId(taskId));
    }

    @GetMapping("/assignee/{email}")
    public ResponseEntity<List<JiraIssueResponse>> getByAssigneeEmail(@PathVariable String email) {
        return ResponseEntity.ok(issueService.getIssuesByAssigneeEmail(email));
    }

    @PatchMapping("/{jiraIssueId}/link/{taskId}")
    public ResponseEntity<JiraIssueResponse> linkToTask(@PathVariable UUID jiraIssueId,
                                                         @PathVariable UUID taskId) {
        return ResponseEntity.ok(issueService.linkToTask(jiraIssueId, taskId));
    }

    @PatchMapping("/{jiraIssueId}/unlink")
    public ResponseEntity<JiraIssueResponse> unlinkFromTask(@PathVariable UUID jiraIssueId) {
        return ResponseEntity.ok(issueService.unlinkFromTask(jiraIssueId));
    }

    @DeleteMapping("/{jiraIssueId}")
    public ResponseEntity<Void> delete(@PathVariable UUID jiraIssueId) {
        issueService.deleteJiraIssue(jiraIssueId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{jiraIssueKey}/comments")
    public ResponseEntity<Map<String, String>> addComment(@PathVariable String jiraIssueKey,
                                                           @RequestBody Map<String, String> body) {
        String content = body.getOrDefault("content", "");
        issueService.addCommentToIssue(jiraIssueKey, content);
        return ResponseEntity.ok(Map.of("message", "Comment đã được thêm vào Jira issue " + jiraIssueKey));
    }
}

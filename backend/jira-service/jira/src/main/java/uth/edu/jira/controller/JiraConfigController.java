package uth.edu.jira.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.jira.dto.JiraRequest;
import uth.edu.jira.dto.JiraResponse;
import uth.edu.jira.service.JiraConfigService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jira/configs")
@RequiredArgsConstructor
public class JiraConfigController {

    private final JiraConfigService configService;

    @PostMapping
    public ResponseEntity<JiraResponse> create(@Valid @RequestBody JiraRequest request) {
        return new ResponseEntity<>(configService.createJiraConfig(request), HttpStatus.CREATED);
    }

    @GetMapping("/{jiraId}")
    public ResponseEntity<JiraResponse> getById(@PathVariable UUID jiraId) {
        return ResponseEntity.ok(configService.getJiraConfigById(jiraId));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<JiraResponse>> getByGroup(@PathVariable UUID groupId) {
        return ResponseEntity.ok(configService.getJiraConfigsByGroup(groupId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<JiraResponse>> getByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(configService.getJiraConfigsByUser(userId));
    }

    @PutMapping("/{jiraId}")
    public ResponseEntity<JiraResponse> update(@PathVariable UUID jiraId,
                                               @Valid @RequestBody JiraRequest request) {
        return ResponseEntity.ok(configService.updateJiraConfig(jiraId, request));
    }

    @DeleteMapping("/{jiraId}")
    public ResponseEntity<Void> delete(@PathVariable UUID jiraId) {
        configService.deleteJiraConfig(jiraId);
        return ResponseEntity.noContent().build();
    }
}

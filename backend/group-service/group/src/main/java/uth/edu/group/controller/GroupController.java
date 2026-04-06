package uth.edu.group.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.group.dto.*;
import uth.edu.group.service.IGroupService;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private IGroupService groupService;

    // --- GROUP ENDPOINTS ---
    @PostMapping
    public ResponseEntity<GroupResponse> create(@RequestBody GroupRequest request, @RequestHeader("X-User-Id") UUID creatorId) {
        return new ResponseEntity<>(groupService.createGroup(request, creatorId), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAll() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupResponse>> getMyGroups(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(groupService.getMyGroups(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    // --- MEMBER ENDPOINTS (Sub-resources) ---
    @PostMapping("/{groupId}/members")
    public ResponseEntity<String> addMember(@PathVariable UUID groupId, @RequestBody MemberRequest request) {
        groupService.addMemberToGroup(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đã thêm Thành Viên!");
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<MemberRequest>> getMembers(@PathVariable UUID groupId) {
        return ResponseEntity.ok(groupService.getMembersByGroupId(groupId));
    }
}
package uth.edu.group.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import uth.edu.group.dto.*;
import uth.edu.group.service.IGroupService;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    @Autowired
    private IGroupService groupService;

    // group endpoints
    @PostMapping
    public ResponseEntity<GroupResponse> create(@RequestBody GroupRequest request, @RequestHeader("X-User-Id") UUID creatorId) {
        return new ResponseEntity<>(groupService.createGroup(request, creatorId), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<GroupResponse>> getAll() {
        return ResponseEntity.ok(groupService.getAllGroups());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupResponse>> getMyGroups(@PathVariable UUID userId) {
        return ResponseEntity.ok(groupService.getMyGroups(userId));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GroupResponse> update(@PathVariable UUID id, @RequestBody GroupRequest request) {
        return ResponseEntity.ok(groupService.updateGroup(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        groupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    // member endpoints
    @PostMapping("/{groupId}/members")
    public ResponseEntity<String> addMember(@PathVariable UUID groupId, @RequestBody MemberRequest request) {
        groupService.addMemberToGroup(groupId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đã thêm Thành Viên!");
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<MemberRequest>> getMembers(@PathVariable UUID groupId) {
        return ResponseEntity.ok(groupService.getMembersByGroupId(groupId));
    }
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID groupId, @PathVariable UUID userId) {
        groupService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }
}
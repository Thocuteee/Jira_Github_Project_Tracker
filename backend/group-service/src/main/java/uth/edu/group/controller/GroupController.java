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
import java.util.Locale;

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

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupResponse>> getMyGroups(@RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(groupService.getMyGroups(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<GroupResponse>> getGroupsByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(groupService.getMyGroups(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
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
    public ResponseEntity<String> addMember(
            @PathVariable UUID groupId,
            @RequestBody MemberRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdminOrLeader(groupId, userId, userRole, userRoles);
        groupService.addMemberToGroup(groupId, request, userId, authorization);
        return ResponseEntity.status(HttpStatus.CREATED).body("Đã thêm Thành Viên!");
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberResponse>> getMembers(@PathVariable UUID groupId) {
        return ResponseEntity.ok(groupService.getMembersByGroupId(groupId));
    }

    @GetMapping("/{groupId}/members/ids")
    public ResponseEntity<List<UUID>> getMemberIds(@PathVariable UUID groupId) {
        return ResponseEntity.ok(groupService.getMemberIdsByGroupId(groupId));
    }
    @PutMapping("/{groupId}/members/{userId}/role")
    public ResponseEntity<String> updateMemberRole(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            @RequestBody MemberRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles
    ) {
        requireAdmin(userRole, userRoles);
        groupService.updateMemberRole(groupId, userId, request.getRoleInGroup());
        return ResponseEntity.ok("Đã cập nhật quyền thành viên!");
    }

    @PutMapping("/{groupId}/leader")
    public ResponseEntity<String> setLeader(
            @PathVariable UUID groupId,
            @RequestBody MemberRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles
    ) {
        requireAdminOrLeader(groupId, userId, userRole, userRoles);
        groupService.setGroupLeader(groupId, request.getUserId());
        return ResponseEntity.ok("Đã cập nhật leader!");
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            @RequestHeader(value = "X-User-Id", required = false) UUID currentUserId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Roles", required = false) String userRoles
    ) {
        requireAdminOrLeader(groupId, currentUserId, userRole, userRoles);
        groupService.removeMemberFromGroup(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/checkLeader")
    public ResponseEntity<Boolean> checkLeader(@PathVariable UUID id, @RequestHeader("X-User-Id") UUID userId) {
        return ResponseEntity.ok(groupService.checkLeader(id, userId));
    }

    @GetMapping("/{id}/checkLeader/{userId}")
    public ResponseEntity<Boolean> checkLeaderByUserId(@PathVariable UUID id, @PathVariable UUID userId) {
        return ResponseEntity.ok(groupService.checkLeader(id, userId));
    }

    private void requireAdmin(String userRole, String userRoles) {
        String combinedRoles = String.join(",", userRole == null ? "" : userRole, userRoles == null ? "" : userRoles);
        if (!combinedRoles.toUpperCase(Locale.ROOT).contains("ROLE_ADMIN")) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Chỉ Admin được phép thực hiện thao tác này.");
        }
    }

    private void requireAdminOrLeader(UUID groupId, UUID userId, String userRole, String userRoles) {
        String combinedRoles = String.join(",", userRole == null ? "" : userRole, userRoles == null ? "" : userRoles)
                .toUpperCase(Locale.ROOT);
        if (combinedRoles.contains("ROLE_ADMIN")) {
            return;
        }
        if (userId != null && groupService.checkLeader(groupId, userId)) {
            return;
        }
        throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Chỉ Admin hoặc Leader của nhóm được phép thực hiện thao tác này."
        );
    }
}
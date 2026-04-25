package uth.edu.group.service;

import uth.edu.group.dto.*;
import java.util.UUID;
import java.util.List;

public interface IGroupService {
    // Group operations
    GroupResponse createGroup(GroupRequest request, UUID creatorId);
    List<GroupResponse> getAllGroups();
    List<GroupResponse> getMyGroups(UUID userId);
    GroupResponse getGroupById(UUID id);
    GroupResponse updateGroup(UUID id, GroupRequest request);
    void deleteGroup(UUID id);
    boolean checkLeader(UUID groupId, UUID userId);

    // Member operations
    void addMemberToGroup(UUID groupId, MemberRequest memberRequest, UUID adderId);
    void updateMemberRole(UUID groupId, UUID userId, String roleInGroup);
    void setGroupLeader(UUID groupId, UUID leaderId);
    void removeMemberFromGroup(UUID groupId, UUID userId);
    List<GroupMemberResponse> getMembersByGroupId(UUID groupId);
    List<UUID> getMemberIdsByGroupId(UUID groupId);
}
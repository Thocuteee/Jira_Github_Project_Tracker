package uth.edu.group.service;

import uth.edu.group.dto.*;
import java.util.UUID;
import java.util.List;

public interface IGroupService {
    // Group operations
    GroupResponse createGroup(GroupRequest request, UUID creatorId);
    List<GroupResponse> getAllGroups();
    GroupResponse getGroupById(UUID id);
    GroupResponse updateGroup(UUID id, GroupRequest request);
    void deleteGroup(UUID id);

    // Member operations
    void addMemberToGroup(UUID groupId, MemberRequest memberRequest);
    void removeMemberFromGroup(UUID groupId, UUID userId);
    List<MemberRequest> getMembersByGroupId(UUID groupId);
}
package uth.edu.group.mapper;

import org.springframework.stereotype.Component;
import uth.edu.group.dto.*;
import uth.edu.group.model.*;
import java.util.Locale;

@Component
public class GroupMapper {

    public Group toEntity(GroupRequest request) {
        if (request == null) return null;

        Group group = new Group();
        group.setGroupName(request.getGroupName());
        group.setLeaderId(request.getLeaderId());
        group.setJiraProjectKey(request.getJiraProjectKey());
        group.setGithubRepoUrl(request.getGithubRepoUrl());
        group.setWorkspaceId(request.getWorkspaceId());
        group.setDescription(request.getDescription());
        group.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 8);
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            group.setStatus(GroupStatus.valueOf(request.getStatus().trim().toUpperCase(Locale.ROOT)));
        } else {
            group.setStatus(GroupStatus.ACTIVE);
        }

        return group;
    }

    public GroupResponse toResponse(Group group) {
        if (group == null) return null;

        GroupResponse res = new GroupResponse();
        res.setGroupId(group.getGroupId());
        res.setGroupName(group.getGroupName());
        res.setLeaderId(group.getLeaderId());
        res.setCreatedAt(group.getCreatedAt());
        res.setJiraProjectKey(group.getJiraProjectKey());
        res.setGithubRepoUrl(group.getGithubRepoUrl());
        res.setWorkspaceId(group.getWorkspaceId());
        res.setDescription(group.getDescription());
        res.setStatus(group.getStatus() == null ? GroupStatus.ACTIVE.name() : group.getStatus().name());
        res.setMaxMembers(group.getMaxMembers());

        return res;
    }

    public MemberRequest toMemberDto(GroupMember member) {
        MemberRequest dto = new MemberRequest();
        dto.setUserId(member.getUserId());
        dto.setRoleInGroup(member.getRoleInGroup());
        dto.setGithubUsername(member.getGithubUsername());
        dto.setJiraAccountId(member.getJiraAccountId());
        return dto;
    }
}
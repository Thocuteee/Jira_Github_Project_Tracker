package uth.edu.group.service.impl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.group.model.*;
import uth.edu.group.dto.*;
import uth.edu.group.repository.*;
import uth.edu.group.service.IGroupService;
import uth.edu.group.mapper.GroupMapper;

import java.util.UUID;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements IGroupService {

    private final GroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final GroupMapper groupMapper;

    @Override
    @Transactional
    public GroupResponse createGroup(GroupRequest request, UUID creatorId) {

        Group group = groupMapper.toEntity(request);
        group.setCreatedBy(creatorId);

        if (group.getLeaderId() == null) {
            group.setLeaderId(creatorId);
        }

        Group saved = groupRepo.save(group);

        // auto add leader
        MemberRequest memberReq = new MemberRequest();
        memberReq.setUserId(creatorId);
        memberReq.setRoleInGroup("LEADER");

        addMemberToGroup(saved.getGroupId(), memberReq);

        return groupMapper.toResponse(saved);
    }

    @Override
    public List<GroupResponse> getAllGroups() {
        return groupRepo.findAll()
                .stream()
                .map(groupMapper::toResponse)
                .toList();
    }

    @Override
    public GroupResponse getGroupById(UUID id) {
        return groupRepo.findById(id)
                .map(groupMapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
    }

    @Override
    @Transactional
    public GroupResponse updateGroup(UUID id, GroupRequest request) {

        Group group = groupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        if (request.getGroupName() != null)
            group.setGroupName(request.getGroupName());

        if (request.getLeaderId() != null)
            group.setLeaderId(request.getLeaderId());

        if (request.getJiraProjectKey() != null)
            group.setJiraProjectKey(request.getJiraProjectKey());

        if (request.getGithubRepoUrl() != null)
            group.setGithubRepoUrl(request.getGithubRepoUrl());

        return groupMapper.toResponse(groupRepo.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(UUID id) {
        memberRepo.deleteByGroupGroupId(id);
        groupRepo.deleteById(id);
    }

    @Override
    public void addMemberToGroup(UUID groupId, MemberRequest req) {

        if (memberRepo.existsByGroupGroupIdAndUserId(groupId, req.getUserId())) {
            throw new RuntimeException("Thành viên đã tồn tại!");
        }

        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(req.getUserId());
        member.setRoleInGroup(
                req.getRoleInGroup() != null ? req.getRoleInGroup() : "MEMBER"
        );

        member.setGithubUsername(req.getGithubUsername());
        member.setJiraAccountId(req.getJiraAccountId());

        memberRepo.save(member);
    }

    @Override
    @Transactional
    public void removeMemberFromGroup(UUID groupId, UUID userId) {
        memberRepo.deleteByGroupGroupId(groupId);
    }

    @Override
    public List<MemberRequest> getMembersByGroupId(UUID groupId) {
        return memberRepo.findByGroupGroupId(groupId)
                .stream()
                .map(groupMapper::toMemberDto)
                .toList();
    }

    @Override
    public List<GroupResponse> getMyGroups(UUID userId) {
        return memberRepo.findByUserId(userId)
                .stream()
                .map(m -> groupMapper.toResponse(m.getGroup()))
                .toList();
    }
}
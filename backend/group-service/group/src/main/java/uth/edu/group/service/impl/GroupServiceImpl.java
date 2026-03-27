package uth.edu.group.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.group.model.*;
import uth.edu.group.dto.*;
import uth.edu.group.repository.*;
import uth.edu.group.service.IGroupService;
import uth.edu.group.mapper.GroupMapper;

import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements IGroupService {
    
    @Autowired 
    private GroupRepository groupRepo;

    @Autowired 
    private GroupMemberRepository memberRepo;
    
    @Autowired 
    private GroupMapper groupMapper; 

    @Override
    @Transactional
    public GroupResponse createGroup(GroupRequest request, UUID creatorId) {
        Group group = groupMapper.toEntity(request);
        group.setCreatedBy(creatorId);
        if (group.getLeaderId() == null) group.setLeaderId(creatorId);
        
        Group saved = groupRepo.save(group);

        // Auto-add creator as LEADER
        MemberRequest memberReq = new MemberRequest();
        memberReq.setUserId(creatorId);
        memberReq.setRoleInGroup("LEADER");
        addMemberToGroup(saved.getGroupId(), memberReq);

        return groupMapper.toResponse(saved);
    }

    @Override
    public List<GroupResponse> getAllGroups() {
        return groupRepo.findAll().stream()
                .map(groupMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GroupResponse getGroupById(UUID id) {
        Group group = groupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        return groupMapper.toResponse(group);
    }

    @Override
    @Transactional
    public GroupResponse updateGroup(UUID id, GroupRequest request) {
        Group group = groupRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        group.setGroupName(request.getGroupName());
        group.setLeaderId(request.getLeaderId());
        return groupMapper.toResponse(groupRepo.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(UUID id) {
        // Xóa tất cả thành viên trước khi xóa group 
        List<GroupMember> members = memberRepo.findByGroupGroupId(id);
        memberRepo.deleteAll(members);
        groupRepo.deleteById(id);
    }

    @Override
    public void addMemberToGroup(UUID groupId, MemberRequest req) {
        Group group = groupRepo.findById(groupId).orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(req.getUserId());
        member.setRoleInGroup(req.getRoleInGroup());
        memberRepo.save(member);
    }

    @Override
    @Transactional
    public void removeMemberFromGroup(UUID groupId, UUID userId) {
        
    }

    @Override
    public List<MemberRequest> getMembersByGroupId(UUID groupId) {
        return memberRepo.findByGroupGroupId(groupId).stream().map(groupMapper::toMemberDto).collect(Collectors.toList());
    }
}
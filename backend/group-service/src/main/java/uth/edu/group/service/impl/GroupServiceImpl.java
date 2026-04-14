package uth.edu.group.service.impl;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import uth.edu.group.config.RabbitMQConfig;
import uth.edu.group.dto.GroupRequest;
import uth.edu.group.dto.GroupResponse;
import uth.edu.group.dto.MemberRequest;
import uth.edu.group.mapper.GroupMapper;
import uth.edu.group.model.Group;
import uth.edu.group.model.GroupMember;
import uth.edu.group.repository.GroupMemberRepository;
import uth.edu.group.repository.GroupRepository;
import uth.edu.group.service.IGroupService;


@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements IGroupService {
    private static final Logger log = LoggerFactory.getLogger(GroupServiceImpl.class);

    private final GroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final GroupMapper groupMapper;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public GroupResponse createGroup(GroupRequest request, UUID creatorId) {
        Group group = groupMapper.toEntity(request);
        group.setCreatedBy(creatorId);
        Group saved = groupRepo.save(group);
        return groupMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupResponse> getAllGroups() {
        return groupRepo.findAll()
                .stream()
                .map(groupMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
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

        if (request.getGroupName() != null) group.setGroupName(request.getGroupName());
        if (request.getLeaderId() != null) group.setLeaderId(request.getLeaderId());
        if (request.getJiraProjectKey() != null) group.setJiraProjectKey(request.getJiraProjectKey());
        if (request.getGithubRepoUrl() != null) group.setGithubRepoUrl(request.getGithubRepoUrl());
        if (request.getWorkspaceId() != null) group.setWorkspaceId(request.getWorkspaceId());
        if (request.getDescription() != null) group.setDescription(request.getDescription());
        if (request.getStatus() != null) group.setStatus(request.getStatus());

        return groupMapper.toResponse(groupRepo.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(UUID id) {
        if (!groupRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm để xóa.");
        }

        try {
            memberRepo.deleteByGroupGroupId(id);
            groupRepo.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Không thể xóa nhóm do còn dữ liệu liên quan.",
                    ex
            );
        }

        // Deletion must not fail if RabbitMQ is temporarily unavailable.
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.GROUP_EXCHANGE, "group.deleted", id.toString());
        } catch (Exception ex) {
            log.warn("Deleted group {} but failed to publish deletion event to RabbitMQ: {}", id, ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void addMemberToGroup(UUID groupId, MemberRequest req) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        String normalizedRole = req.getRoleInGroup() == null ? "LECTURER" : req.getRoleInGroup().trim().toUpperCase();
        if (!normalizedRole.equals("LEADER") && !normalizedRole.equals("MEMBER") && !normalizedRole.equals("LECTURER")) {
            normalizedRole = "MEMBER";
        }

        GroupMember existingMember = memberRepo.findByGroupGroupIdAndUserId(groupId, req.getUserId()).orElse(null);
        if (existingMember != null) {
            // If member already exists and is being promoted as leader, upgrade in place.
            if ("LEADER".equals(normalizedRole)) {
                updateMemberRole(groupId, req.getUserId(), "LEADER");
                return;
            }
            throw new RuntimeException("Thành viên đã tồn tại!");
        }

        long currentCount = memberRepo.countByGroupGroupId(groupId);
        if (currentCount >= 8) {
            throw new RuntimeException("Nhóm đã đạt số lượng thành viên tối đa (8)!");
        }

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(req.getUserId());
        member.setRoleInGroup(normalizedRole);
        member.setGithubUsername(req.getGithubUsername());
        member.setJiraAccountId(req.getJiraAccountId());

        memberRepo.save(member);

        // Keep existing role states; do not downgrade previous leaders automatically.
        if ("LEADER".equals(normalizedRole)) {
            if (group.getLeaderId() == null) {
                group.setLeaderId(req.getUserId());
                groupRepo.save(group);
            }
        }
    }

    @Override
    @Transactional
    public void updateMemberRole(UUID groupId, UUID userId, String roleInGroup) {
        List<GroupMember> members = memberRepo.findByGroupGroupId(groupId);
        GroupMember target = members.stream()
                .filter(member -> member.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên trong nhóm!"));

        String normalizedRole = roleInGroup == null ? "LECTURER" : roleInGroup.trim().toUpperCase();
        if (!normalizedRole.equals("LEADER") && !normalizedRole.equals("MEMBER") && !normalizedRole.equals("LECTURER")) {
            normalizedRole = "MEMBER";
        }

        target.setRoleInGroup(normalizedRole);
        memberRepo.save(target);

        if ("LEADER".equals(normalizedRole)) {
            Group group = groupRepo.findById(groupId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
            if (group.getLeaderId() == null) {
                group.setLeaderId(userId);
                groupRepo.save(group);
            }
        }
    }

    @Override
    @Transactional
    public void setGroupLeader(UUID groupId, UUID leaderId) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        group.setLeaderId(leaderId);
        groupRepo.save(group);
    }

    @Override
    @Transactional
    public void removeMemberFromGroup(UUID groupId, UUID userId) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        if (group.getLeaderId() != null && group.getLeaderId().equals(userId)) {
            throw new RuntimeException("Không thể xóa leader hiện tại. Hãy phân quyền leader cho người khác trước.");
        }

        memberRepo.deleteByGroupGroupIdAndUserId(groupId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberRequest> getMembersByGroupId(UUID groupId) {
        return memberRepo.findByGroupGroupId(groupId)
                .stream()
                .map(groupMapper::toMemberDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(UUID userId) {
        return memberRepo.findByUserId(userId)
                .stream()
                .map(m -> groupMapper.toResponse(m.getGroup()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkLeader(UUID groupId, UUID userId) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        return group.getLeaderId() != null && group.getLeaderId().equals(userId);
    }
}
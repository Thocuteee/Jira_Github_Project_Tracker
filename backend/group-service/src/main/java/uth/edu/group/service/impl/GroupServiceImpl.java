package uth.edu.group.service.impl;
import java.util.List;
import java.util.Objects;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import uth.edu.group.config.RabbitMQConfig;
import uth.edu.group.dto.*;
import uth.edu.group.mapper.GroupMapper;
import uth.edu.group.model.*;
import uth.edu.group.repository.*;
import uth.edu.group.service.*;


@Service
@RequiredArgsConstructor
@Slf4j
public class GroupServiceImpl implements IGroupService {
    private static final Set<String> ALLOWED_GROUP_ROLES = Set.of("LEADER", "MEMBER", "LECTURER");

    private final GroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final GroupMapper groupMapper;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public GroupResponse createGroup(GroupRequest request, UUID creatorId) {

        Group group = groupMapper.toEntity(request);
        group.setCreatedBy(creatorId);
        // Rule: user creates group -> becomes leader of that group.
        group.setLeaderId(creatorId);

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            group.setStatus(GroupStatus.ACTIVE);
        } else {
            try {
                group.setStatus(GroupStatus.valueOf(request.getStatus().trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Status không hợp lệ");
            }
        }
        group.setWorkspaceId(request.getWorkspaceId());
        group.setDescription(request.getDescription());

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
        List<Group> groups = groupRepo.findAll();
        log.info("Fetching all groups. Found: {}", groups.size());
        return groups.stream()
                .filter(Objects::nonNull)
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

        if (request.getWorkspaceId() != null)
            group.setWorkspaceId(request.getWorkspaceId());

        if (request.getDescription() != null)
            group.setDescription(request.getDescription());

        if (request.getStatus() != null) {
            try {
                group.setStatus(GroupStatus.valueOf(request.getStatus().trim().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Status không hợp lệ");
            }
        }

        return groupMapper.toResponse(groupRepo.save(group));
    }

    @Override
    @Transactional
    public void deleteGroup(UUID id) {
        if (!groupRepo.existsById(id)) {
            throw new RuntimeException("Không tìm thấy nhóm để xóa!");
        }
        memberRepo.deleteByGroupGroupId(id);
        groupRepo.deleteById(id);

        // Notify other services (e.g. task, requirement)
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.GROUP_EXCHANGE, "group.deleted", id.toString());
            log.info("Sent group.deleted notification for groupId: {}", id);
        } catch (Exception e) {
            log.error("Failed to send RabbitMQ notification for group deletion: {}. Error: {}", id, e.getMessage());
            // Avoid throwing here to prevent rolling back successful database deletion
        }
    }

    @Override
    public void addMemberToGroup(UUID groupId, MemberRequest req) {

        long currentCount = memberRepo.countByGroupGroupId(groupId);
        if (currentCount >= 8) {
            throw new RuntimeException("Nhóm đã đạt số lượng thành viên tối đa (8)!");
        }

        if (memberRepo.existsByGroupGroupIdAndUserId(groupId, req.getUserId())) {
            throw new RuntimeException("Thành viên đã tồn tại!");
        }

        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUserId(req.getUserId());
        String normalizedRole = normalizeGroupRole(req.getRoleInGroup());
        member.setRoleInGroup(normalizedRole);

        member.setGithubUsername(req.getGithubUsername());
        member.setJiraAccountId(req.getJiraAccountId());

        memberRepo.save(member);

        if ("LEADER".equals(normalizedRole)) {
            setGroupLeader(groupId, req.getUserId());
        }
    }

    @Override
    @Transactional
    public void removeMemberFromGroup(UUID groupId, UUID userId) {
        memberRepo.deleteByGroupGroupIdAndUserId(groupId, userId);
    }

    @Override
    public List<GroupMemberResponse> getMembersByGroupId(UUID groupId) {
        return memberRepo.findByGroupGroupId(groupId)
                .stream()
                .map(groupMapper::toMemberResponse)
                .toList();
    }

    @Override
    public List<UUID> getMemberIdsByGroupId(UUID groupId) {
        return memberRepo.findByGroupGroupId(groupId)
                .stream()
                .map(GroupMember::getUserId)
                .toList();
    }

    @Override
    public List<GroupResponse> getMyGroups(UUID userId) {
        log.info("Fetching groups for userId: {}", userId);
        Map<UUID, Group> groupsById = new LinkedHashMap<>();

        List<GroupMember> memberships = memberRepo.findByUserId(userId);
        log.info("Found {} memberships for user {}", memberships.size(), userId);
        memberships.stream()
                .filter(Objects::nonNull)
                .map(GroupMember::getGroup)
                .filter(Objects::nonNull)
                .forEach(group -> groupsById.put(group.getGroupId(), group));

        List<Group> ledGroups = groupRepo.findByLeaderId(userId);
        log.info("Found {} led groups for user {}", ledGroups.size(), userId);
        ledGroups.stream()
                .filter(Objects::nonNull)
                .forEach(group -> groupsById.put(group.getGroupId(), group));

        log.info("Total unique groups for user {}: {}", userId, groupsById.size());
        return groupsById.values().stream()
                .map(groupMapper::toResponse)
                .toList();
    }

    @Override
    public boolean checkLeader(UUID groupId, UUID userId) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        return group.getLeaderId() != null && group.getLeaderId().equals(userId);
    }

    @Override
    public void updateMemberRole(UUID groupId, UUID userId, String roleInGroup) {
        GroupMember member = memberRepo.findByGroupGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên trong nhóm!"));

        String normalizedRole = normalizeGroupRole(roleInGroup);
        if ("LEADER".equals(normalizedRole)) {
            String currentRole = member.getRoleInGroup() == null
                    ? "MEMBER"
                    : member.getRoleInGroup().trim().toUpperCase(Locale.ROOT);
            if ("LECTURER".equals(currentRole)) {
                throw new RuntimeException("Không thể chuyển quyền Leader cho Lecturer. Vui lòng chọn một Member.");
            }
            setGroupLeader(groupId, userId);
            return;
        }

        member.setRoleInGroup(normalizedRole);
        memberRepo.save(member);
    }

    @Override
    public void setGroupLeader(UUID groupId, UUID leaderId) {
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        GroupMember targetMember = memberRepo.findByGroupGroupIdAndUserId(groupId, leaderId)
                .orElseThrow(() -> new RuntimeException("Chỉ có thể chuyển quyền Leader cho thành viên đã có trong nhóm!"));

        String targetRole = targetMember.getRoleInGroup() == null
                ? "MEMBER"
                : targetMember.getRoleInGroup().trim().toUpperCase(Locale.ROOT);
        if ("LECTURER".equals(targetRole)) {
            throw new RuntimeException("Không thể chuyển quyền Leader cho Lecturer. Vui lòng chọn một Member.");
        }

        UUID oldLeaderId = group.getLeaderId();
        group.setLeaderId(leaderId);
        groupRepo.save(group);

        if (oldLeaderId != null && !oldLeaderId.equals(leaderId)) {
            memberRepo.findByGroupGroupIdAndUserId(groupId, oldLeaderId).ifPresent(oldLeader -> {
                oldLeader.setRoleInGroup("MEMBER");
                memberRepo.save(oldLeader);
            });
        }

        targetMember.setRoleInGroup("LEADER");
        memberRepo.save(targetMember);
    }

    private String normalizeGroupRole(String rawRole) {
        if (rawRole == null || rawRole.trim().isEmpty()) {
            return "MEMBER";
        }
        String normalized = rawRole.trim().toUpperCase(Locale.ROOT);
        return ALLOWED_GROUP_ROLES.contains(normalized) ? normalized : "MEMBER";
    }
}
package uth.edu.group.mapper;

import org.springframework.stereotype.Component;
import uth.edu.group.dto.*;
import uth.edu.group.model.*;
import java.util.UUID;

@Component
public class GroupMapper {

    // Chuyển từ Request DTO sang Entity 
    public Group toEntity(GroupRequest request) {
        if (request == null) return null;
        Group group = new Group();
        group.setGroupName(request.getGroupName());
        group.setLeaderId(request.getLeaderId());
        return group;
    }

    // Chuyển từ Entity sang Response DTO
    public GroupResponse toResponse(Group group) {
        if (group == null) return null;
        GroupResponse res = new GroupResponse();
        res.setGroupId(group.getGroupId());
        res.setGroupName(group.getGroupName());
        res.setLeaderId(group.getLeaderId());
        res.setCreatedAt(group.getCreatedAt());
        return res;
    }

    // Mapper cho Member
    public MemberRequest toMemberDto(GroupMember member) {
        MemberRequest dto = new MemberRequest();
        dto.setUserId(member.getUserId());
        return dto;
    }
}
package uth.edu.requirement.service;

import uth.edu.requirement.dto.RequirementGroupRequest;
import uth.edu.requirement.dto.RequirementGroupResponse;

import java.util.List;
import java.util.UUID;

public interface IRequirementGroupService {

    List<RequirementGroupResponse> getAllGroups();

    RequirementGroupResponse getGroupById(UUID groupId);

    RequirementGroupResponse createGroup(RequirementGroupRequest request);

    RequirementGroupResponse updateGroup(UUID groupId, RequirementGroupRequest request);

    void deleteGroup(UUID groupId);
}


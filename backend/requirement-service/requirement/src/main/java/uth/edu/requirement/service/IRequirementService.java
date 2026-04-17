package uth.edu.requirement.service;

import uth.edu.requirement.dto.RequirementRequest;
import uth.edu.requirement.dto.RequirementResponse;

import java.util.List;
import java.util.UUID;

public interface IRequirementService {
    List<RequirementResponse> getAllRequirements();
    RequirementResponse getRequirementById(UUID id);
    List<RequirementResponse> getRequirementsByGroupId(UUID groupId);
    RequirementResponse createRequirement(RequirementRequest request);
    RequirementResponse updateRequirement(UUID id, RequirementRequest request);
    void deleteRequirement(UUID id);
    List<RequirementResponse> getRequirementsByIds(List<UUID> ids);
}

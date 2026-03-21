package uth.edu.auth.service;

import uth.edu.auth.dto.RequirementRequest;
import uth.edu.auth.model.Requirement;

import java.util.List;
import java.util.UUID;

public interface IRequirementService {
    List<Requirement> getAllRequirements();
    Requirement getRequirementById(UUID id);
    List<Requirement> getRequirementsByProjectId(UUID projectId);
    Requirement createRequirement(RequirementRequest request);
    Requirement updateRequirement(UUID id, RequirementRequest request);
    void deleteRequirement(UUID id);
}
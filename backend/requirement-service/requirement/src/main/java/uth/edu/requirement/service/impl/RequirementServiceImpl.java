package uth.edu.requirement.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uth.edu.requirement.dto.RequirementRequest;
import uth.edu.requirement.dto.RequirementResponse;
import uth.edu.requirement.model.ERequirementPriority;
import uth.edu.requirement.model.ERequirementStatus;
import uth.edu.requirement.model.Requirement;
import uth.edu.requirement.repository.RequirementRepository;
import uth.edu.requirement.service.IRequirementService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RequirementServiceImpl implements IRequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Override
    public List<RequirementResponse> getAllRequirements() {
        return requirementRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public RequirementResponse getRequirementById(UUID id) {
        return mapToResponse(findRequirementById(id));
    }

    @Override
    public List<RequirementResponse> getRequirementsByGroupId(UUID groupId) {
        return requirementRepository.findByGroupId(groupId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public RequirementResponse createRequirement(RequirementRequest request) {
        Requirement requirement = new Requirement();

        requirement.setGroupId(UUID.fromString(request.getGroupId()));
        requirement.setTitle(request.getTitle());
        requirement.setDescription(request.getDescription());
        requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            requirement.setPriority(ERequirementPriority.valueOf(request.getPriority().toUpperCase()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));
        }

        requirement.setJiraIssueKey(request.getJiraIssueKey());

        return mapToResponse(requirementRepository.save(requirement));
    }

    @Override
    public RequirementResponse updateRequirement(UUID id, RequirementRequest request) {
        Requirement requirement = findRequirementById(id);

        if (request.getGroupId() != null && !request.getGroupId().isBlank()) {
            requirement.setGroupId(UUID.fromString(request.getGroupId()));
        }

        if (request.getTitle() != null) {
            requirement.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            requirement.setDescription(request.getDescription());
        }

        if (request.getCreatedBy() != null && !request.getCreatedBy().isBlank()) {
            requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));
        }

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            requirement.setPriority(ERequirementPriority.valueOf(request.getPriority().toUpperCase()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));
        }

        if (request.getJiraIssueKey() != null) {
            requirement.setJiraIssueKey(request.getJiraIssueKey());
        }

        return mapToResponse(requirementRepository.save(requirement));
    }

    @Override
    public void deleteRequirement(UUID id) {
        Requirement requirement = findRequirementById(id);
        requirementRepository.delete(requirement);
    }

    private Requirement findRequirementById(UUID id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Requirement!"));
    }

    private RequirementResponse mapToResponse(Requirement requirement) {
        return RequirementResponse.builder()
                .requirementId(requirement.getRequirementId().toString())
                .groupId(requirement.getGroupId() != null ? requirement.getGroupId().toString() : null)
                .title(requirement.getTitle())
                .description(requirement.getDescription())
                .createdBy(requirement.getCreatedBy() != null ? requirement.getCreatedBy().toString() : null)
                .createdAt(requirement.getCreatedAt() != null ? requirement.getCreatedAt().toString() : null)
                .priority(requirement.getPriority() != null ? requirement.getPriority().name() : null)
                .status(requirement.getStatus() != null ? requirement.getStatus().name() : null)
                .jiraIssueKey(requirement.getJiraIssueKey())
                .build();
    }
}
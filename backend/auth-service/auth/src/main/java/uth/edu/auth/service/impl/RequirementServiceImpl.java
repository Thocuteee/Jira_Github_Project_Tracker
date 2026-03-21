package uth.edu.auth.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uth.edu.auth.dto.RequirementRequest;
import uth.edu.auth.model.ERequirementStatus;
import uth.edu.auth.model.Requirement;
import uth.edu.auth.repository.RequirementRepository;
import uth.edu.auth.service.IRequirementService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RequirementServiceImpl implements IRequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Override
    public List<Requirement> getAllRequirements() {
        return requirementRepository.findAll();
    }

    @Override
    public Requirement getRequirementById(UUID id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Requirement!"));
    }

    @Override
    public List<Requirement> getRequirementsByProjectId(UUID projectId) {
        return requirementRepository.findByProjectId(projectId);
    }

    @Override
    public Requirement createRequirement(RequirementRequest request) {
        Requirement requirement = new Requirement();
        requirement.setTitle(request.getTitle());
        requirement.setContent(request.getContent());
        requirement.setProjectId(UUID.fromString(request.getProjectId()));
        requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));
        requirement.setCreatedAt(LocalDateTime.now());
        requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));

        return requirementRepository.save(requirement);
    }

    @Override
    public Requirement updateRequirement(UUID id, RequirementRequest request) {
        Requirement requirement = getRequirementById(id);

        if (request.getTitle() != null) {
            requirement.setTitle(request.getTitle());
        }

        if (request.getContent() != null) {
            requirement.setContent(request.getContent());
        }

        if (request.getStatus() != null) {
            requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));
        }

        if (request.getProjectId() != null) {
            requirement.setProjectId(UUID.fromString(request.getProjectId()));
        }

        if (request.getCreatedBy() != null) {
            requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));
        }

        return requirementRepository.save(requirement);
    }

    @Override
    public void deleteRequirement(UUID id) {
        requirementRepository.deleteById(id);
    }
}
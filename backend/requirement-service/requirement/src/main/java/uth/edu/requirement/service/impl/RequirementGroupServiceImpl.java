package uth.edu.requirement.service.impl;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import uth.edu.requirement.dto.RequirementGroupRequest;
import uth.edu.requirement.dto.RequirementGroupResponse;
import uth.edu.requirement.exception.BadRequestException;
import uth.edu.requirement.exception.ResourceNotFoundException;
import uth.edu.requirement.model.RequirementGroup;
import uth.edu.requirement.repository.RequirementGroupRepository;
import uth.edu.requirement.service.IRequirementGroupService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequirementGroupServiceImpl implements IRequirementGroupService {

    private final RequirementGroupRepository requirementGroupRepository;
    private final ModelMapper modelMapper;

    @Override
    public List<RequirementGroupResponse> getAllGroups() {
        return requirementGroupRepository.findAll()
                .stream()
                .map(group -> modelMapper.map(group, RequirementGroupResponse.class))
                .toList();
    }

    @Override
    public RequirementGroupResponse getGroupById(UUID groupId) {
        RequirementGroup group = requirementGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Requirement Group với id: " + groupId));

        return modelMapper.map(group, RequirementGroupResponse.class);
    }

    @Override
    public RequirementGroupResponse createGroup(RequirementGroupRequest request) {
        if (request.getGroupName() == null || request.getGroupName().trim().isEmpty()) {
            throw new BadRequestException("groupName không được để trống");
        }

        RequirementGroup group = new RequirementGroup();
        group.setGroupName(request.getGroupName().trim());
        group.setDescription(request.getDescription());

        RequirementGroup savedGroup = requirementGroupRepository.save(group);
        return modelMapper.map(savedGroup, RequirementGroupResponse.class);
    }

    @Override
    public RequirementGroupResponse updateGroup(UUID groupId, RequirementGroupRequest request) {
        RequirementGroup group = requirementGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Requirement Group với id: " + groupId));

        if (request.getGroupName() != null && !request.getGroupName().trim().isEmpty()) {
            group.setGroupName(request.getGroupName().trim());
        }

        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        RequirementGroup updatedGroup = requirementGroupRepository.save(group);
        return modelMapper.map(updatedGroup, RequirementGroupResponse.class);
    }

    @Override
    public void deleteGroup(UUID groupId) {
        RequirementGroup group = requirementGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Requirement Group với id: " + groupId));

        requirementGroupRepository.delete(group);
    }
}

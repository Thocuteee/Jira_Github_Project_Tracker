package uth.edu.requirement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.requirement.dto.RequirementGroupRequest;
import uth.edu.requirement.model.RequirementGroup;
import uth.edu.requirement.repository.RequirementGroupRepository;

import java.util.UUID;

@RestController
@RequestMapping("/api/requirement-groups")
public class RequirementGroupController {

    @Autowired
    private RequirementGroupRepository groupRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(groupRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(
                groupRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy Requirement Group!"))
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody RequirementGroupRequest request) {
        RequirementGroup group = new RequirementGroup();
        group.setGroupName(request.getGroupName());
        group.setDescription(request.getDescription());
        return ResponseEntity.ok(groupRepository.save(group));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable UUID id,
                                    @RequestBody RequirementGroupRequest request) {
        RequirementGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Requirement Group!"));

        if (request.getGroupName() != null) {
            group.setGroupName(request.getGroupName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        return ResponseEntity.ok(groupRepository.save(group));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        groupRepository.deleteById(id);
        return ResponseEntity.ok("Đã xóa Requirement Group thành công!");
    }
}

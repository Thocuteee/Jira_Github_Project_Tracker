package uth.edu.requirement.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.requirement.dto.RequirementRequest;
import uth.edu.requirement.service.IRequirementService;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/requirements")
public class RequirementController {

    @Autowired
    private IRequirementService requirementService;

    @GetMapping
    public ResponseEntity<?> getAllRequirements() {
        return ResponseEntity.ok(requirementService.getAllRequirements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRequirementById(@PathVariable UUID id) {
        return ResponseEntity.ok(requirementService.getRequirementById(id));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<?> getRequirementsByGroupId(@PathVariable UUID groupId) {
        return ResponseEntity.ok(requirementService.getRequirementsByGroupId(groupId));
    }

    @PostMapping("/list")
    public ResponseEntity<?> getRequirementsByIds(@RequestBody List<UUID> ids) {
        return ResponseEntity.ok(requirementService.getRequirementsByIds(ids));
    }

    @PostMapping
    public ResponseEntity<?> createRequirement(@RequestBody RequirementRequest request) {
        try {
            return ResponseEntity.ok(requirementService.createRequirement(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequirement(@PathVariable UUID id,
                                               @RequestBody RequirementRequest request) {
        try {
            return ResponseEntity.ok(requirementService.updateRequirement(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequirement(@PathVariable UUID id) {
        requirementService.deleteRequirement(id);
        return ResponseEntity.ok("Đã xóa Requirement thành công!");
    }
}
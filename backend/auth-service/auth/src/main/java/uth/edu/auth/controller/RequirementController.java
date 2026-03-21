package uth.edu.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import uth.edu.auth.dto.RequirementRequest;
import uth.edu.auth.service.IRequirementService;

import java.util.UUID;

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

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getRequirementsByProjectId(@PathVariable UUID projectId) {
        return ResponseEntity.ok(requirementService.getRequirementsByProjectId(projectId));
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
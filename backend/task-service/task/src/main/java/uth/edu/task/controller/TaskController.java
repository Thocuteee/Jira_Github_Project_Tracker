package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.TaskAssignRequest;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskStatusUpdateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.dto.response.TaskResponse;
import uth.edu.task.service.TaskService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // Tạo Task mới
    // URL POST: /api/tasks/
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request){
        TaskResponse response = taskService.createTask(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    // Lấy chi tiết một Task theo ID
    // URL GET: /api/tasks/{taskId}
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID taskId){
        TaskResponse response = taskService.getTaskById(taskId);

        return ResponseEntity.ok(response);
    }


    // Lấy danh sách Task của một Requirement
    // URL GET: /api/tasks/requirement/{requirementId}
    @GetMapping("/requirement/{requirementId}")
    public ResponseEntity<List<TaskResponse>> getTaskByRequirementId(@PathVariable String requirementId){
        List<TaskResponse> responses = taskService.getTasksByRequirementId(requirementId);

        return ResponseEntity.ok(responses);
    }


    // Cập nhật một Task
    // URL PATCH: /api/tasks/{taskId}
    @PatchMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskUpdateRequest request){
        TaskResponse response = taskService.updateTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    // Giao Task cho Member
    // URL PATCH: /api/tasks/{taskId}/assign
    @PatchMapping("/{taskId}/assign")
    public ResponseEntity<TaskResponse> assignTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskAssignRequest request) {
        TaskResponse response = taskService.assignTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    // Thay đổi Status của một Task
    // URL PATCH: /api/tasks/{taskId}/status
    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> changeTaskStatus(@PathVariable UUID taskId,
                                                         @Valid @RequestBody TaskStatusUpdateRequest request){
        TaskResponse response = taskService.changeTaskStatus(taskId, request);

        return ResponseEntity.ok(response);
    }


    // Xoá một Task
    // URL DELETE: /api/tasks/{taskId}
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId){
        taskService.deleteTask(taskId);

        return ResponseEntity.noContent().build();
    }



}

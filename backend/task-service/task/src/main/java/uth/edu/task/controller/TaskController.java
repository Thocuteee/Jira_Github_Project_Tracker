package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.TaskCreateRequest;
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
    // API POST: /api/tasks/
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request){
        TaskResponse response = taskService.createTask(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }


    // Lấy chi tiết một Task theo ID
    // API GET: /api/tasks/{taskId}
    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID taskId){
        TaskResponse response = taskService.getTaskById(taskId);

        return ResponseEntity.ok(response);
    }


    // Lấy danh sách Task của một Requirement
    // API GET: /api/tasks/requirement/{requirementId}
    @GetMapping("/requirement/{requirementId}")
    public ResponseEntity<List<TaskResponse>> getTaskByRequirementId(@PathVariable UUID requirementId){
        List<TaskResponse> responses = taskService.getTasksByRequirementId(requirementId);

        return ResponseEntity.ok(responses);
    }


    // Cập nhật một Task
    // API PATCH: /api/tasks/{taskId}
    @PatchMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID taskId, @Valid @RequestBody TaskUpdateRequest request){
        TaskResponse response = taskService.updateTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    // Xoá một Task
    // API DELETE: /api/tasks/{taskId}
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId){
        taskService.deleteTask(taskId);

        return ResponseEntity.noContent().build();
    }



}

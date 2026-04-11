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
import uth.edu.task.config.UserContextHolder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request){
        TaskResponse response = taskService.createTask(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }



    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID taskId){
        TaskResponse response = taskService.getTaskById(taskId);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/requirement/{requirementId}")
    public ResponseEntity<List<TaskResponse>> getTaskByRequirementId(@PathVariable UUID requirementId){
        List<TaskResponse> responses = taskService.getTasksByRequirementId(requirementId);

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<TaskResponse>> getTasksByGroup(@PathVariable UUID groupId) {
        UUID userId = UserContextHolder.getUserId();
        List<TaskResponse> responses = taskService.getTasksForUserInGroup(groupId, userId);
        return ResponseEntity.ok(responses);
    }


    @PatchMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskUpdateRequest request){
        TaskResponse response = taskService.updateTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/{taskId}/assign")
    public ResponseEntity<TaskResponse> assignTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskAssignRequest request) {
        TaskResponse response = taskService.assignTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> changeTaskStatus(@PathVariable UUID taskId,
                                                         @Valid @RequestBody TaskStatusUpdateRequest request){
        TaskResponse response = taskService.changeTaskStatus(taskId, request);

        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId){
        taskService.deleteTask(taskId);

        return ResponseEntity.noContent().build();
    }



}

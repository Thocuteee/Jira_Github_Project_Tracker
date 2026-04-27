package uth.edu.task.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uth.edu.task.dto.request.TaskAssignRequest;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskStatusUpdateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.dto.response.TaskResponse;
import uth.edu.task.service.TaskService;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.response.MyTaskSummaryResponse;
import uth.edu.task.model.Task;
import uth.edu.task.model.ETaskStatus;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.mapper.TaskMapper;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request){
        TaskResponse response = taskService.createTask(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }



    @GetMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID taskId){
        TaskResponse response = taskService.getTaskById(taskId);

        return ResponseEntity.ok(response);
    }


    @GetMapping("/requirement/{requirementId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<List<TaskResponse>> getTaskByRequirementId(@PathVariable UUID requirementId){
        List<TaskResponse> responses = taskService.getTasksByRequirementId(requirementId);

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/by-requirements")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<List<TaskResponse>> getTasksByRequirementIds(@RequestBody List<UUID> requirementIds) {
        return ResponseEntity.ok(taskService.getTasksByRequirementIds(requirementIds));
    }

    @GetMapping("/group/{groupId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<List<TaskResponse>> getTasksByGroup(@PathVariable UUID groupId) {
        UUID userId = UserContextHolder.getUserId();
        List<TaskResponse> responses = taskService.getTasksForUserInGroup(groupId, userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Member dashboard: toàn bộ task được assigned cho user hiện tại trên mọi group.
     */
    @GetMapping("/my-tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<List<TaskResponse>> getMyAssignedTasks() {
        UUID userId = UserContextHolder.getUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<TaskResponse> responses = taskRepository.findByAssignedTo(userId).stream()
                .map(taskMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Member dashboard: summary thống kê nhanh (open/done/overdue/total).
     */
    @GetMapping("/my-tasks/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<MyTaskSummaryResponse> getMyAssignedTasksSummary() {
        UUID userId = UserContextHolder.getUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Task> tasks = taskRepository.findByAssignedTo(userId);
        long total = tasks.size();
        long done = tasks.stream().filter(t -> t.getStatus() == ETaskStatus.DONE).count();
        long open = tasks.stream().filter(t -> t.getStatus() != ETaskStatus.DONE).count();
        LocalDate today = LocalDate.now();
        long overdue = tasks.stream()
                .filter(t -> t.getStatus() != ETaskStatus.DONE)
                .filter(t -> t.getDueDate() != null && t.getDueDate().isBefore(today))
                .count();

        MyTaskSummaryResponse res = new MyTaskSummaryResponse();
        res.setTotal(total);
        res.setDone(done);
        res.setOpen(open);
        res.setOverdue(overdue);
        return ResponseEntity.ok(res);
    }


    @PatchMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskUpdateRequest request){
        TaskResponse response = taskService.updateTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/{taskId}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<TaskResponse> assignTask(@PathVariable UUID taskId,
                                                   @Valid @RequestBody TaskAssignRequest request) {
        TaskResponse response = taskService.assignTask(taskId, request);

        return ResponseEntity.ok(response);
    }


    @PatchMapping("/{taskId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<TaskResponse> changeTaskStatus(@PathVariable UUID taskId,
                                                         @Valid @RequestBody TaskStatusUpdateRequest request){
        TaskResponse response = taskService.changeTaskStatus(taskId, request);

        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{taskId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LECTURER', 'TEAM_LEADER', 'TEAM_MEMBER', 'STUDENT')")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID taskId){
        taskService.deleteTask(taskId);

        return ResponseEntity.noContent().build();
    }



}

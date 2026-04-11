package uth.edu.task.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uth.edu.task.dto.response.TaskHistoryResponse;
import uth.edu.task.model.TaskHistory;
import uth.edu.task.repository.TaskHistoryRepository;
import uth.edu.task.repository.TaskRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskHistoryController {

    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskRepository taskRepository;

    @GetMapping("/{taskId}/history")
    public ResponseEntity<List<TaskHistoryResponse>> getHistory(@PathVariable UUID taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Không tìm thấy Task!");
        }
        List<TaskHistory> rows = taskHistoryRepository.findByTask_TaskIdOrderByChangedAtDesc(taskId);
        return ResponseEntity.ok(rows.stream().map(h -> toResponse(h, taskId)).collect(Collectors.toList()));
    }

    private TaskHistoryResponse toResponse(TaskHistory h, UUID taskId) {
        return TaskHistoryResponse.builder()
                .historyId(h.getHistoryId())
                .taskId(taskId)
                .changedBy(h.getChangedBy())
                .fieldChanged(h.getFieldChanged())
                .oldValue(h.getOldValue())
                .newValue(h.getNewValue())
                .changedAt(h.getChangedAt())
                .build();
    }
}

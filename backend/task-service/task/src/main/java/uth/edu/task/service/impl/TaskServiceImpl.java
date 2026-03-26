package uth.edu.task.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.request.TaskAssignRequest;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskStatusUpdateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.dto.response.TaskResponse;
import uth.edu.task.mapper.TaskMapper;
import uth.edu.task.model.ETaskStatus;
import uth.edu.task.model.Task;
import uth.edu.task.model.TaskHistory;
import uth.edu.task.repository.AttachmentRepository;
import uth.edu.task.repository.TaskCommentRepository;
import uth.edu.task.repository.TaskHistoryRepository;
import uth.edu.task.repository.TaskRepository;
import uth.edu.task.service.TaskService;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final AttachmentRepository attachmentRepository;
    private final TaskMapper taskMapper;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        String role = UserContextHolder.getUserRole();
        UUID currentUserId = UserContextHolder.getUserId();

        // Kiểm tra quyền: Chỉ Leader mới được tạo Task
        if (!"TEAM_LEADER".equals(role)) {
            throw new RuntimeException("Chỉ Team Leader mới có quyền tạo Task!");
        }

        Task task = taskMapper.toEntity(request);
        task.setStatus(ETaskStatus.TODO);
        task.setCreatedBy(currentUserId);

        Task savedTask = taskRepository.save(task);

        saveTaskHistory(savedTask, currentUserId, "CREATE", "null", "Task Created");

        return taskMapper.toResponse(savedTask);
    }

    @Override
    public TaskResponse getTaskById(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));
        return taskMapper.toResponse(task);
    }

    @Override
    public List<TaskResponse> getTasksByRequirementId(UUID requirementId) {
        List<Task> tasks = taskRepository.findByRequirementId(requirementId);
        return tasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskUpdateRequest request) {
        String role = UserContextHolder.getUserRole();
        UUID currentUserId = UserContextHolder.getUserId();

        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));

        // Kiểm tra quyền Update
        if ("TEAM_MEMBER".equals(role)) {
            // Member chỉ được sửa Task nều Task đó được giao cho chính họ
            if (existingTask.getAssignedTo() == null || !existingTask.getAssignedTo().equals(currentUserId)) {
                throw new RuntimeException("Bạn không có quyền chỉnh sửa Task của người khác!");
            }

            // Nếu Member cố tình gửi lên các trường cấm sửa
            if (request.getTitle() != null || request.getPriority() != null || request.getDueDate() != null) {
                throw new RuntimeException("Lỗi phân quyền: Bạn không có quyền chỉnh sửa các trường này!");
            }
        } else if (!"TEAM_LEADER".equals(role)) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa Task!");
        }

        // Kiểm tra xem trạng thái có thay đổi không để ghi lịch sử
        if (request.getTitle() != null && !request.getTitle().equals(existingTask.getTitle())) {
            saveTaskHistory(existingTask, currentUserId, "TITLE", existingTask.getTitle(), request.getTitle());
        }

        if (request.getDescription() != null && !request.getDescription().equals(existingTask.getDescription())) {
            String oldDesc = existingTask.getDescription() != null ? existingTask.getDescription() : "null";
            saveTaskHistory(existingTask, currentUserId, "DESCRIPTION", oldDesc, request.getDescription());
        }

        if (request.getPriority() != null && existingTask.getPriority() != request.getPriority()) {
            saveTaskHistory(existingTask, currentUserId, "PRIORITY", existingTask.getPriority().name(), request.getPriority().name());
        }

        if (request.getDueDate() != null && !request.getDueDate().equals(existingTask.getDueDate())) {
            String oldDate = existingTask.getDueDate() != null ? existingTask.getDueDate().toString() : "null";
            saveTaskHistory(existingTask, currentUserId, "DUE_DATE", oldDate, request.getDueDate().toString());
        }

        taskMapper.updateEntityFromRequest(request, existingTask);

        Task updatedTask = taskRepository.save(existingTask);
        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse assignTask(UUID taskId, TaskAssignRequest request) {
        String role = UserContextHolder.getUserRole();
        UUID currentUserId = UserContextHolder.getUserId();

        // Chỉ Leader mới được giao việc
        if (!"TEAM_LEADER".equals(role)) {
            throw new RuntimeException("Lỗi phân quyền: Chỉ Team Leader mới có quyền giao Task!");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));

        if (!Objects.equals(task.getAssignedTo(), request.getAssignedTo())) {
            String oldAssign = task.getAssignedTo() != null ? task.getAssignedTo().toString() : "null";

            saveTaskHistory(task, currentUserId, "ASSIGN_TO", oldAssign, request.getAssignedTo().toString());
        }
        task.setAssignedTo(request.getAssignedTo());

        Task updatedTask = taskRepository.save(task);
        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse changeTaskStatus(UUID taskId, TaskStatusUpdateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();
        Task task = taskRepository.findById(taskId).orElseThrow(
                ()-> new RuntimeException("Không tìm thấy Task!"));

        // Chỉ người đang được giao Task và Leader mới được đổi Status
        boolean isAssignee = currentUserId.equals(task.getAssignedTo());
        boolean isLeader = "TEAM_LEADER".equals(UserContextHolder.getUserRole());

        if (!isAssignee && !isLeader) {
            throw new RuntimeException("Bạn không có quyền đổi trạng thái Task này!");
        }

        if (!Objects.equals(task.getStatus(), request.getStatus())) {
            saveTaskHistory(task, currentUserId, "STATUS", task.getStatus().toString(), request.getStatus().toString());
        }

        task.setStatus(request.getStatus());

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public void deleteTask(UUID taskId) {
        String role = UserContextHolder.getUserRole();

        if (!"TEAM_LEADER".equals(role)) {
            throw new RuntimeException("Chỉ Team Leader mới có quyền xóa Task!");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task để xóa!"));


        taskHistoryRepository.deleteAllByTask_TaskId(taskId);
        taskCommentRepository.deleteAllByTask_TaskId(taskId);
        attachmentRepository.deleteAllByTask_TaskId(taskId);
        taskRepository.delete(task);
    }

    // Hàm phụ trợ
    private void saveTaskHistory(Task task, UUID changedBy, String field, String oldVal, String newVal) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .changedBy(changedBy)
                .fieldChanged(field)
                .oldValue(oldVal)
                .newValue(newVal)
                .build();
        taskHistoryRepository.save(history);
    }
}

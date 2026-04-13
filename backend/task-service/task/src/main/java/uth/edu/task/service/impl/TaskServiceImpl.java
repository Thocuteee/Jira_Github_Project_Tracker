package uth.edu.task.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import uth.edu.task.config.UserContextHolder;
import uth.edu.task.dto.event.TaskEvent;
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
import uth.edu.task.service.publisher.TaskEventPublisher;
import uth.edu.task.client.GroupClient;
import uth.edu.task.dto.response.external.GroupMemberResponse;

import java.time.LocalDateTime;
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
    private final TaskEventPublisher taskEventPublisher;
    private final TaskMapper taskMapper;
    private final GroupClient groupClient;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();
        UUID groupId = UUID.fromString(request.getGroupId());

        // Kiểm tra quyền: Chỉ Nhóm trưởng trong Group hoặc ADMIN mới được tạo Task
        if (!isLeaderInGroup(groupId, currentUserId) && !isAdmin()) {
            throw new RuntimeException("Chỉ Nhóm trưởng hoặc Admin mới có quyền tạo Task!");
        }

        Task task = taskMapper.toEntity(request);
        task.setCreatedBy(currentUserId);
        task.setStatus(ETaskStatus.TODO);

        Task savedTask = taskRepository.save(task);

        saveTaskHistory(savedTask, currentUserId, "CREATE", "null", "Task Created");

        TaskEvent event = TaskEvent.builder()
                .taskId(savedTask.getTaskId())
                .title(savedTask.getTitle())
                .assignedTo(savedTask.getAssignedTo())
                .requirementId(savedTask.getRequirementId())
                .eventType("CREATED")
                .timestamp(LocalDateTime.now())
                .build();

        taskEventPublisher.publishTaskEvent(event);

        return taskMapper.toResponse(savedTask);
    }

    @Override
    public TaskResponse getTaskById(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));
        
        UUID currentUserId = UserContextHolder.getUserId();
        
        // Kiểm tra quyền xem: Phải thuộc nhóm, hoặc là Admin/Lecturer
        if (!isMemberOfGroup(task.getGroupId(), currentUserId) && !isAdmin() && !isLecturer()) {
            throw new RuntimeException("Bạn không có quyền xem chi tiết Task này vì không thuộc Nhóm!");
        }
        
        return taskMapper.toResponse(task);
    }

    @Override
    public List<TaskResponse> getTasksByRequirementId(UUID requirementId) {
        List<Task> tasks = taskRepository.findByRequirementId(requirementId);
        if (tasks.isEmpty()) return java.util.Collections.emptyList();

        UUID currentUserId = UserContextHolder.getUserId();
        UUID groupId = tasks.get(0).getGroupId();

        // Kiểm tra quyền xem danh sách: Phải thuộc nhóm, hoặc là Admin/Lecturer
        if (!isMemberOfGroup(groupId, currentUserId) && !isAdmin() && !isLecturer()) {
            throw new RuntimeException("Bạn không có quyền xem danh sách Task của Requirement này!");
        }

        return tasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getTasksForUserInGroup(UUID groupId, UUID userId) {
        // Nếu là Admin hoặc Lecturer thì cho xem toàn bộ
        if (isAdmin() || isLecturer() || ! "NONE".equalsIgnoreCase(getUserRoleString(groupId, userId))) {
            List<Task> tasks = taskRepository.findByGroupId(groupId);
            return tasks.stream()
                    .map(taskMapper::toResponse)
                    .collect(Collectors.toList());
        }
        
        return java.util.Collections.emptyList();
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskUpdateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();

        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));

        UUID groupId = existingTask.getGroupId();
        boolean isLeader = isLeaderInGroup(groupId, currentUserId);

        // Kiểm tra quyền Update: Chỉ Leader hoặc Admin mới được update thông tin Task
        if (!isLeader && !isAdmin()) {
            throw new RuntimeException("Lỗi phân quyền: Chỉ Nhóm trưởng hoặc Admin mới có quyền chỉnh sửa Task!");
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
            saveTaskHistory(existingTask, currentUserId, "PRIORITY", existingTask.getPriority().name(),
                    request.getPriority().name());
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
        UUID currentUserId = UserContextHolder.getUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task!"));

        // Chỉ Nhóm trưởng hoặc Admin mới được giao việc
        if (!isLeaderInGroup(task.getGroupId(), currentUserId) && !isAdmin()) {
            throw new RuntimeException("Lỗi phân quyền: Chỉ Nhóm trưởng hoặc Admin mới có quyền giao Task!");
        }

        if (!Objects.equals(task.getAssignedTo(), request.getAssignedTo())) {
            String oldAssign = task.getAssignedTo() != null ? task.getAssignedTo().toString() : "null";

            saveTaskHistory(task, currentUserId, "ASSIGN_TO", oldAssign, request.getAssignedTo().toString());
        }
        task.setAssignedTo(request.getAssignedTo());

        TaskEvent event = TaskEvent.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .assignedTo(task.getAssignedTo())
                .requirementId(task.getRequirementId())
                .eventType("ASSIGN")
                .timestamp(LocalDateTime.now())
                .build();

        taskEventPublisher.publishTaskEvent(event);

        Task updatedTask = taskRepository.save(task);
        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse changeTaskStatus(UUID taskId, TaskStatusUpdateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();
        Task task = taskRepository.findById(taskId).orElseThrow(
                () -> new RuntimeException("Không tìm thấy Task!"));

        // Chỉ người đang được giao Task, Nhóm trưởng hoặc Admin mới được đổi Status
        boolean isAssignee = task.getAssignedTo() != null && currentUserId.equals(task.getAssignedTo());
        boolean isLeader = isLeaderInGroup(task.getGroupId(), currentUserId);

        if (!isAssignee && !isLeader && !isAdmin()) {
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
        UUID currentUserId = UserContextHolder.getUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task để xóa!"));

        if (!isLeaderInGroup(task.getGroupId(), currentUserId) && !isAdmin()) {
            throw new RuntimeException("Chỉ Nhóm trưởng hoặc Admin mới có quyền xóa Task!");
        }

        taskHistoryRepository.deleteAllByTask_TaskId(taskId);
        taskCommentRepository.deleteAllByTask_TaskId(taskId);
        attachmentRepository.deleteAllByTask_TaskId(taskId);
        taskRepository.delete(task);
    }

    // Hàm phụ trợ
    private String getUserRoleString(UUID groupId, UUID userId) {
        if (userId == null) {
            log.warn("getUserRoleString: userId is null, returning NONE for groupId: {}", groupId);
            return "NONE";
        }
        try {
            List<GroupMemberResponse> members = groupClient.getGroupMembers(groupId);
            if (members == null) {
                log.error("getUserRoleString: groupClient returned null members list for groupId: {}", groupId);
                return "NONE";
            }
            return members.stream()
                    .filter(m -> m.getUserId().equals(userId))
                    .map(GroupMemberResponse::getRoleInGroup)
                    .findFirst()
                    .orElse("NONE");
        } catch (Exception e) {
            log.error("Lỗi khi lấy Role từ group-service cho groupId {} (userId: {}): {}", groupId, userId, e.getMessage());
            return "NONE";
        }
    }

    private boolean isLeaderInGroup(UUID groupId, UUID userId) {
        return "LEADER".equalsIgnoreCase(getUserRoleString(groupId, userId));
    }

    private boolean isMemberOfGroup(UUID groupId, UUID userId) {
        String role = getUserRoleString(groupId, userId);
        return !"NONE".equalsIgnoreCase(role);
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private boolean isLecturer() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_LECTURER"));
    }

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

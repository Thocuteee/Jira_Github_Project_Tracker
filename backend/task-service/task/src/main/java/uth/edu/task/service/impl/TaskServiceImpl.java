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
import uth.edu.task.client.RequirementClient;
import uth.edu.task.client.FileServiceClient;
import uth.edu.task.dto.response.external.GroupMemberResponse;
import uth.edu.task.dto.response.external.RequirementResponse;

import java.time.LocalDateTime;
import java.util.Collections;
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
    private final RequirementClient requirementClient;
    private final FileServiceClient fileServiceClient;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();
        UUID groupId = UUID.fromString(request.getGroupId());

        // Kiểm tra quyền: Nhóm trưởng trong Group, ADMIN, hoặc TEAM_LEADER role
        boolean hasPermission = isAdmin() || isTeamLeader() || isLeaderInGroup(groupId, currentUserId);
        if (!hasPermission) {
            throw new RuntimeException("Chỉ Nhóm trưởng hoặc Admin mới có quyền tạo Task!");
        }

        Task task = taskMapper.toEntity(request);
        task.setCreatedBy(currentUserId);
        task.setStatus(ETaskStatus.TODO);

        Task savedTask = taskRepository.save(task);

        saveTaskHistory(savedTask, currentUserId, "CREATE", "null", "Task Created");

        try {
            publishTaskEvent(savedTask, "CREATED");
        } catch (Exception e) {
            log.warn("Could not publish task event (RabbitMQ unavailable?): {}", e.getMessage());
        }

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
    public List<TaskResponse> getTasksByRequirementIds(List<UUID> requirementIds) {
        if (requirementIds == null || requirementIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        List<UUID> distinct = requirementIds.stream().distinct().toList();
        List<Task> tasks = taskRepository.findByRequirementIdIn(distinct);
        if (tasks.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        UUID currentUserId = UserContextHolder.getUserId();
        UUID groupId = tasks.get(0).getGroupId();
        if (!tasks.stream().allMatch(t -> groupId.equals(t.getGroupId()))) {
            throw new RuntimeException("Danh sách requirement chứa task thuộc nhiều nhóm — không hỗ trợ.");
        }
        if (!isMemberOfGroup(groupId, currentUserId) && !isAdmin() && !isLecturer()) {
            throw new RuntimeException("Bạn không có quyền xem danh sách Task của các requirement này!");
        }
        return tasks.stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponse> getTasksForUserInGroup(UUID groupId, UUID userId) {
        String roleInGroup = getUserRoleString(groupId, userId);
        boolean isLeader = "LEADER".equalsIgnoreCase(roleInGroup);
        boolean isMember = "MEMBER".equalsIgnoreCase(roleInGroup);

        // 1. Admin & Lecturer & Group Leader: Xem toàn bộ Task của nhóm
        if (isAdmin() || isLecturer() || isLeader) {
            List<Task> tasks = taskRepository.findByGroupId(groupId);
            return tasks.stream()
                    .map(taskMapper::toResponse)
                    .collect(Collectors.toList());
        }

        // 2. Team Member: Theo yêu cầu chỉ xem các task được giao cho mình
        if (isMember) {
            List<Task> tasks = taskRepository.findByGroupId(groupId);
            return tasks.stream()
                    .filter(t -> userId.equals(t.getAssignedTo())) // Chỉ lấy task của mình
                    .map(taskMapper::toResponse)
                    .collect(Collectors.toList());
        }
        
        return Collections.emptyList();
   
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID taskId, TaskUpdateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();

        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Task với ID: " + taskId));

        UUID groupId = existingTask.getGroupId();
        boolean isLeader = isLeaderInGroup(groupId, currentUserId);

        boolean isAssignee = currentUserId.equals(existingTask.getAssignedTo());

        // Kiểm tra quyền Update: Leader, Admin, hoặc người được giao (Assignee) mới được update thông tin Task
        if (!isLeader && !isAdmin() && !isAssignee) {
            throw new RuntimeException("Lỗi phân quyền: Chỉ Nhóm trưởng, Quản trị viên, hoặc Người được giao mới có quyền chỉnh sửa Task!");
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

        try {
            publishTaskEvent(task, "ASSIGN");
        } catch (Exception e) {
            log.warn("Could not publish task event (RabbitMQ unavailable?): {}", e.getMessage());
        }

        Task updatedTask = taskRepository.save(task);
        return taskMapper.toResponse(updatedTask);
    }

    @Override
    @Transactional
    public TaskResponse changeTaskStatus(UUID taskId, TaskStatusUpdateRequest request) {
        UUID currentUserId = UserContextHolder.getUserId();
        Task task = taskRepository.findById(taskId).orElseThrow(
                () -> new RuntimeException("Không tìm thấy Task!"));

        // Chỉ Leader của group hiện tại hoặc Admin mới được đổi trạng thái
        boolean isLeader = isLeaderInGroup(task.getGroupId(), currentUserId);

        if (!isLeader && !isAdmin()) {
            throw new RuntimeException("Chỉ Nhóm trưởng của group hoặc Admin mới được đổi trạng thái Task!");
        }

        if (!Objects.equals(task.getStatus(), request.getStatus())) {
            saveTaskHistory(task, currentUserId, "STATUS", task.getStatus().toString(), request.getStatus().toString());
        }

        task.setStatus(request.getStatus());
        Task saved = taskRepository.save(task);

        TaskEvent event = TaskEvent.builder()
                .taskId(saved.getTaskId())
                .title(saved.getTitle())
                .assignedTo(saved.getAssignedTo())
                .requirementId(saved.getRequirementId())
                .eventType(request.getStatus().name())
                .timestamp(LocalDateTime.now())
                .build();
        taskEventPublisher.publishTaskEvent(event);

        return taskMapper.toResponse(saved);
        Task savedTask = taskRepository.save(task);
        
        try {
            publishTaskEvent(savedTask, "STATUS_UPDATE");
        } catch (Exception e) {
            log.warn("Không thể gửi sự kiện lên RabbitMQ (RabbitMQ unavailable?): {}", e.getMessage());
        }

        return taskMapper.toResponse(savedTask);
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
        
        // Gọi File Service để xóa toàn bộ file vật lý liên quan tới Task này
        fileServiceClient.deleteFilesByReference(taskId.toString(), "TASK");
        
        attachmentRepository.deleteAllByTask_TaskId(taskId);
        taskRepository.delete(task);
    }

    // Hàm phụ trợ
    private String getUserRoleString(UUID groupId, UUID userId) {
        if (userId == null) {
            return "NONE";
        }
        try {
            List<GroupMemberResponse> members = groupClient.getGroupMembers(groupId);
            if (members == null) {
                return "NONE";
            }
            return members.stream()
                    .filter(m -> m.getUserId().equals(userId))
                    .map(GroupMemberResponse::getRoleInGroup)
                    .findFirst()
                    .orElse("NONE");
        } catch (Exception e) {
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

    private boolean isTeamLeader() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEAM_LEADER"));
    }

    private void saveTaskHistory(Task task, UUID changedBy, String field, String oldVal, String newVal) {
        TaskHistory history = TaskHistory.builder()
                .task(task)
                .changedBy(changedBy)
                .fieldChanged(field)
                .oldValue(oldVal)
                .newValue(newVal)
                .build();
        TaskHistory savedHistory = taskHistoryRepository.save(history);
    }

    private void publishTaskEvent(Task task, String eventType) {
        String jiraIssueKey = null;
        try {
            RequirementResponse reqResponse = requirementClient.getRequirementById(task.getRequirementId());
            if (reqResponse != null) {
                jiraIssueKey = reqResponse.getJiraIssueKey();
            }
        } catch (Exception e) {
            log.warn("Không thể lấy chi tiết requirement cho việc đồng bộ Jira: {}", e.getMessage());
        }

        TaskEvent event = TaskEvent.builder()
                .taskId(task.getTaskId())
                .title(task.getTitle())
                .assignedTo(task.getAssignedTo())
                .requirementId(task.getRequirementId())
                .jiraIssueKey(jiraIssueKey)
                .eventType(eventType)
                .status(task.getStatus() != null ? task.getStatus().name() : null)
                .timestamp(LocalDateTime.now())
                .build();

        taskEventPublisher.publishTaskEvent(event);
    }
}

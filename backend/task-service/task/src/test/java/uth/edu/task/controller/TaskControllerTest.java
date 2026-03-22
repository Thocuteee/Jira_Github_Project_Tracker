package uth.edu.task.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultHandlers;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import uth.edu.task.dto.request.TaskCreateRequest;
import uth.edu.task.dto.request.TaskUpdateRequest;
import uth.edu.task.model.ETaskPriority;
import uth.edu.task.model.ETaskStatus;
import uth.edu.task.model.Task;
import uth.edu.task.repository.TaskRepository;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TaskRepository taskRepository;


    // Member cố tình tạo Task
    @Test
    public void testCreateTask_ByMember_ShouldFail() throws Exception {
        TaskCreateRequest request = new TaskCreateRequest();
        request.setRequirementId(UUID.randomUUID());
        request.setTitle("Task này của Member");
        request.setPriority(ETaskPriority.LOW);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Id", UUID.randomUUID().toString())
                        .header("X-User-Role", "TEAM_MEMBER"))
                .andDo(MockMvcResultHandlers.print())
                // Kỳ vọng: Bị văng lỗi 400 Bad Request
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                // Kỳ vọng: Câu thông báo lỗi phải chuẩn như trong Service
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Chỉ Team Leader mới có quyền tạo Task!"));
    }


    // Leader tạo Task thiếu trường Title (Bắt buộc)
    @Test
    public void testCreateTask_MissingTitle_ShouldFailValidation() throws Exception {
        TaskCreateRequest request = new TaskCreateRequest();
        request.setRequirementId(UUID.randomUUID());
        // Thiếu Title
        request.setPriority(ETaskPriority.LOW);

        mockMvc.perform(MockMvcRequestBuilders.post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .header("X-User-Role", "TEAM_LEADER"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                // Phải báo lỗi validation ở trường "title"
                .andExpect(MockMvcResultMatchers.jsonPath("$.error.title").exists());
    }



    // Member đổi trạng thái Task của mình
    @Test
    public void testUpdateTask_MemberUpdatesOwnTaskStatus_ShouldSucceed() throws Exception {
        // Data: Leader đã giao Task này cho Member tên là "member-123"
        String memberId = UUID.randomUUID().toString();
        Task task = new Task();
        task.setRequirementId(UUID.randomUUID());
        task.setTitle("Task test update");
        task.setStatus(ETaskStatus.TODO);
        task.setAssignedTo(UUID.fromString(memberId));
        Task savedTask = taskRepository.save(task);

        // Tạo Request: Member muốn đổi status sang IN_PROGRESS
        TaskUpdateRequest updateRequest = new TaskUpdateRequest();
        updateRequest.setStatus(ETaskStatus.IN_PROGRESS);

        // Thực thi API dưới quyền của chính "member-123"
        mockMvc.perform(MockMvcRequestBuilders.patch("/api/tasks/" + savedTask.getTaskId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest))
                        .header("X-User-Id", memberId)
                        .header("X-User-Role", "TEAM_MEMBER"))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.status").value("IN_PROGRESS"));
    }


    // Member đổi trạng thái Task của người khác
    @Test
    public void testUpdateTask_MemberUpdatesSomeoneElsesTask_ShouldFail() throws Exception {
        // Data: Task này của người khác (nguoi-khac-999)
        Task task = new Task();
        task.setRequirementId(UUID.randomUUID());
        task.setTitle("Task của người khác");
        task.setAssignedTo(UUID.randomUUID()); // Một ID bất kỳ không phải là member đang test
        Task savedTask = taskRepository.save(task);

        TaskUpdateRequest updateRequest = new TaskUpdateRequest();
        updateRequest.setStatus(ETaskStatus.DONE);

        String hackerMemberId = UUID.randomUUID().toString();

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/tasks/" + savedTask.getTaskId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest))
                        .header("X-User-Id", hackerMemberId)
                        .header("X-User-Role", "TEAM_MEMBER"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Bạn không có quyền chỉnh sửa Task của người khác!"));
    }


    // Member thay đổi trường không được phép của Task (DuoDate)
    @Test
    public void testUpdateTask_MemberUpdatesForbiddenFields_ShouldFail() throws Exception {
        // Data: Task của chính member đó
        String memberId = UUID.randomUUID().toString();
        Task task = new Task();
        task.setRequirementId(UUID.randomUUID());
        task.setTitle("Task của tôi");
        task.setAssignedTo(UUID.fromString(memberId));
        Task savedTask = taskRepository.save(task);

        TaskUpdateRequest badRequest = new TaskUpdateRequest();
        badRequest.setDueDate(LocalDate.now().plusDays(5));

        mockMvc.perform(MockMvcRequestBuilders.patch("/api/tasks/" + savedTask.getTaskId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest))
                        .header("X-User-Id", memberId)
                        .header("X-User-Role", "TEAM_MEMBER"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Lỗi phân quyền: Bạn chỉ được phép cập nhật Trạng thái (Status) và Mô tả (Description)!"));
    }


    // Member xoá Task
    @Test
    public void testDeleteTask_ByMember_ShouldFail() throws Exception {
        // Data: Thêm 1 task vào DB
        Task task = new Task();
        task.setRequirementId(UUID.randomUUID());
        task.setPriority(ETaskPriority.LOW);
        task.setStatus(ETaskStatus.TODO);
        task.setTitle("Task sắp bị xóa");
        Task savedTask = taskRepository.save(task);

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/tasks/" + savedTask.getTaskId())
                        .header("X-User-Role", "TEAM_MEMBER"))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("$.error").value("Chỉ Team Leader mới có quyền xóa Task!"));
    }


    // Leader xoá Task
    @Test
    public void testDeleteTask_ByLeader_ShouldSucceed() throws Exception {
        // Data: Thêm 1 task vào DB
        Task task = new Task();
        task.setRequirementId(UUID.randomUUID());
        task.setTitle("Task sắp bị Leader xóa");
        task.setPriority(ETaskPriority.MEDIUM);
        task.setStatus(ETaskStatus.TODO);
        Task savedTask = taskRepository.save(task);

        mockMvc.perform(MockMvcRequestBuilders.delete("/api/tasks/" + savedTask.getTaskId())
                        .header("X-User-Role", "TEAM_LEADER"))
                .andExpect(MockMvcResultMatchers.status().isNoContent()); // Trả về 204 No Content

        // Kiểm tra DB ra xem thực sự xoá chưa
        assertTrue(taskRepository.findById(savedTask.getTaskId()).isEmpty());
    }

}

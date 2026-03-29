package uth.edu.requirement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import uth.edu.requirement.dto.RequirementRequest;
import uth.edu.requirement.dto.RequirementResponse;
import uth.edu.requirement.service.IRequirementService;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RequirementController.class)
class RequirementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IRequirementService requirementService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetAllRequirements() throws Exception {
        RequirementResponse response = RequirementResponse.builder()
                .requirementId(UUID.randomUUID().toString())
                .groupId(UUID.randomUUID().toString())
                .title("Test requirement")
                .description("Test description")
                .createdBy(UUID.randomUUID().toString())
                .createdAt("2026-03-29T10:00:00")
                .priority("HIGH")
                .status("NEW")
                .build();

        when(requirementService.getAllRequirements()).thenReturn(List.of(response));

        mockMvc.perform(get("/api/requirements"))
                .andExpect(status().isOk());
    }

    @Test
    void testCreateRequirement() throws Exception {
        RequirementRequest request = new RequirementRequest();
        request.setGroupId(UUID.randomUUID().toString());
        request.setTitle("New requirement");
        request.setDescription("Description");
        request.setCreatedBy(UUID.randomUUID().toString());
        request.setPriority("HIGH");
        request.setStatus("NEW");

        RequirementResponse response = RequirementResponse.builder()
                .requirementId(UUID.randomUUID().toString())
                .groupId(request.getGroupId())
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(request.getCreatedBy())
                .createdAt("2026-03-29T10:00:00")
                .priority(request.getPriority())
                .status(request.getStatus())
                .build();

        when(requirementService.createRequirement(any(RequirementRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/requirements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateRequirement() throws Exception {
        UUID id = UUID.randomUUID();

        RequirementRequest request = new RequirementRequest();
        request.setTitle("Updated requirement");
        request.setPriority("CRITICAL");
        request.setStatus("IN_PROGRESS");

        RequirementResponse response = RequirementResponse.builder()
                .requirementId(id.toString())
                .groupId(UUID.randomUUID().toString())
                .title(request.getTitle())
                .description("Updated description")
                .createdBy(UUID.randomUUID().toString())
                .createdAt("2026-03-29T10:00:00")
                .priority(request.getPriority())
                .status(request.getStatus())
                .build();

        when(requirementService.updateRequirement(eq(id), any(RequirementRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/requirements/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testDeleteRequirement() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/requirements/{id}", id))
                .andExpect(status().isOk());
    }
}
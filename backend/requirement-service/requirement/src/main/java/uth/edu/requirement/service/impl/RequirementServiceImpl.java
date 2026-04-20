package uth.edu.requirement.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uth.edu.requirement.dto.RequirementRequest;
import uth.edu.requirement.dto.RequirementResponse;
import uth.edu.requirement.model.ERequirementPriority;
import uth.edu.requirement.model.ERequirementStatus;
import uth.edu.requirement.model.Requirement;
import uth.edu.requirement.repository.RequirementRepository;
import uth.edu.requirement.service.IRequirementService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class RequirementServiceImpl implements IRequirementService {

    @Autowired
    private RequirementRepository requirementRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Override
    public List<RequirementResponse> getAllRequirements() {
        return requirementRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public RequirementResponse getRequirementById(UUID id) {
        return mapToResponse(findRequirementById(id));
    }

    @Override
    public List<RequirementResponse> getRequirementsByGroupId(UUID groupId) {
        return requirementRepository.findByGroupId(groupId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public RequirementResponse createRequirement(RequirementRequest request) {
        Requirement requirement = new Requirement();

        requirement.setGroupId(UUID.fromString(request.getGroupId()));
        requirement.setTitle(request.getTitle());
        requirement.setDescription(request.getDescription());
        requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            requirement.setPriority(ERequirementPriority.valueOf(request.getPriority().toUpperCase()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));
        }

        requirement.setJiraIssueKey(request.getJiraIssueKey());

        Requirement saved = requirementRepository.save(requirement);

        // Bắn event để Jira Service tự động tạo thẻ nếu đã có config
        if (saved.getJiraIssueKey() == null || saved.getJiraIssueKey().isBlank()) {
            publishSyncEvent("REQUIREMENT_CREATED", saved);
        }

        return mapToResponse(saved);
    }

    @Override
    public RequirementResponse updateRequirement(UUID id, RequirementRequest request) {
        Requirement requirement = findRequirementById(id);

        if (request.getGroupId() != null && !request.getGroupId().isBlank()) {
            requirement.setGroupId(UUID.fromString(request.getGroupId()));
        }

        if (request.getTitle() != null) {
            requirement.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            requirement.setDescription(request.getDescription());
        }

        if (request.getCreatedBy() != null && !request.getCreatedBy().isBlank()) {
            requirement.setCreatedBy(UUID.fromString(request.getCreatedBy()));
        }

        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            requirement.setPriority(ERequirementPriority.valueOf(request.getPriority().toUpperCase()));
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            requirement.setStatus(ERequirementStatus.valueOf(request.getStatus().toUpperCase()));
        }

        if (request.getJiraIssueKey() != null) {
            requirement.setJiraIssueKey(request.getJiraIssueKey());
        }

        return mapToResponse(requirementRepository.save(requirement));
    }

    @Override
    @Transactional
    public void deleteRequirement(UUID id) {
        Requirement requirement = findRequirementById(id);
        
        // Bắn event xóa thẻ trên Jira
        if (requirement.getJiraIssueKey() != null) {
            publishSyncEvent("REQUIREMENT_DELETED", requirement);
        }
        
        requirementRepository.delete(requirement);
    }

    private void publishSyncEvent(String type, Requirement req) {
        java.util.Map<String, Object> event = new java.util.HashMap<>();
        event.put("type", type);
        event.put("requirementId", req.getRequirementId().toString());
        event.put("groupId", req.getGroupId().toString());
        event.put("title", req.getTitle());
        event.put("description", req.getDescription());
        event.put("jiraIssueKey", req.getJiraIssueKey());
        
        // TODO: Cần bù JiraId từ mapping service nếu Jira Service yêu cầu
        // Hiện tại Jira Service sẽ tìm dựa trên GroupId của Integration Mapping
        
        rabbitTemplate.convertAndSend("jira.sync.exchange", "app.requirement", event);
    }

    @RabbitListener(queues = "jira_import_queue")
    @Transactional
    public void handleJiraEvent(java.util.Map<String, Object> event) {
        String eventType = (String) event.get("type");
        if ("jira.assigned".equals(eventType) || event.containsKey("jiraIssueKey")) {
            String reqId = (String) event.get("requirementId");
            if (reqId != null) {
                requirementRepository.findById(UUID.fromString(reqId)).ifPresent(req -> {
                    req.setJiraIssueKey((String) event.get("jiraIssueKey"));
                    requirementRepository.save(req);
                });
            } else if (event.containsKey("jiraIssueKey") && "Epic".equalsIgnoreCase((String) event.get("issueType"))) {
                // Đây là trường hợp Import từ Jira về (Sync)
                autoImportRequirement(event);
            }
        }
    }

    private void autoImportRequirement(java.util.Map<String, Object> event) {
        String key = (String) event.get("jiraIssueKey");
        if (requirementRepository.existsByJiraIssueKey(key)) return;

        Requirement req = new Requirement();
        req.setGroupId(UUID.fromString((String) event.get("groupId")));
        req.setTitle((String) event.get("title"));
        req.setDescription((String) event.get("description"));
        req.setJiraIssueKey(key);
        req.setStatus(ERequirementStatus.NEW);
        req.setPriority(ERequirementPriority.MEDIUM);
        
        // AI: Cần gán createdBy mặc định là Team Leader (sẽ xử lý sau hoặc lấy từ meta)
        // Hiện tại gán tạm UUID rỗng hoặc system user
        req.setCreatedBy(UUID.fromString("00000000-0000-0000-0000-000000000000")); 
        
        requirementRepository.save(req);
    }

    @Override
    public List<RequirementResponse> getRequirementsByIds(List<UUID> ids) {
        return requirementRepository.findAllById(ids)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private Requirement findRequirementById(UUID id) {
        return requirementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Requirement!"));
    }

    private RequirementResponse mapToResponse(Requirement requirement) {
        return RequirementResponse.builder()
                .requirementId(requirement.getRequirementId().toString())
                .groupId(requirement.getGroupId() != null ? requirement.getGroupId().toString() : null)
                .title(requirement.getTitle())
                .description(requirement.getDescription())
                .createdBy(requirement.getCreatedBy() != null ? requirement.getCreatedBy().toString() : null)
                .createdAt(requirement.getCreatedAt() != null ? requirement.getCreatedAt().toString() : null)
                .priority(requirement.getPriority() != null ? requirement.getPriority().name() : null)
                .status(requirement.getStatus() != null ? requirement.getStatus().name() : null)
                .jiraIssueKey(requirement.getJiraIssueKey())
                .build();
    }
}
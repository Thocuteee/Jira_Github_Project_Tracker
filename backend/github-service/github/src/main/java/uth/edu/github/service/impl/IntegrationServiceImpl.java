package uth.edu.github.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uth.edu.github.dto.IntegrationRequest;
import uth.edu.github.dto.IntegrationResponse;
import uth.edu.github.mapper.IntegrationMapper;
import uth.edu.github.model.Integration;
import uth.edu.github.repository.IntegrationRepo;
import uth.edu.github.service.IIntegrationService;

import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IntegrationServiceImpl implements IIntegrationService {

    private final IntegrationRepo integrationRepo;
    private final IntegrationMapper mapper;

    @Override
    public IntegrationResponse create(IntegrationRequest request) {
        // Mỗi group chỉ có 1 integration
        integrationRepo.findByGroupId(request.getGroupId()).ifPresent(i -> {
            throw new RuntimeException("Group này đã có Integration rồi, hãy dùng update!");
        });
        return mapper.toResponse(integrationRepo.save(mapper.toEntity(request)));
    }

    @Override
    public IntegrationResponse getById(UUID integrationId) {
        return mapper.toResponse(integrationRepo.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Integration!")));
    }

    @Override
    public IntegrationResponse getByGroupId(UUID groupId) {
        return integrationRepo.findByGroupId(groupId)
                .map(mapper::toResponse)
                .orElse(null);
    }

    @Override
    public IntegrationResponse update(UUID integrationId, IntegrationRequest request) {
        Integration entity = integrationRepo.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Integration!"));
        entity.setGithubToken(request.getGithubToken());
        entity.setGithubRepo(request.getGithubRepo());
        entity.setJiraProjectKey(request.getJiraProjectKey());
        return mapper.toResponse(integrationRepo.save(entity));
    }

    @Override
    public List<IntegrationResponse> getAll() {
        return integrationRepo.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void delete(UUID integrationId) {
        if (!integrationRepo.existsById(integrationId))
            throw new RuntimeException("Không tìm thấy Integration!");
        integrationRepo.deleteById(integrationId);
    }
}
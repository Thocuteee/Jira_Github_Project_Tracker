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
        return mapper.toResponse(integrationRepo.findByGroupId(groupId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Integration cho group này!")));
    }

    @Override
    public IntegrationResponse update(UUID integrationId, IntegrationRequest request) {
        Integration entity = integrationRepo.findById(integrationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Integration!"));
        entity.setGithubToken(request.getGithubToken());
        entity.setJiraProjectKey(request.getJiraProjectKey());
        return mapper.toResponse(integrationRepo.save(entity));
    }

    @Override
    public void delete(UUID integrationId) {
        if (!integrationRepo.existsById(integrationId))
            throw new RuntimeException("Không tìm thấy Integration!");
        integrationRepo.deleteById(integrationId);
    }
}
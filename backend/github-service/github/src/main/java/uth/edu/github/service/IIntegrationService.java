package uth.edu.github.service;

import uth.edu.github.dto.IntegrationRequest;
import uth.edu.github.dto.IntegrationResponse;
import java.util.UUID;
import java.util.List;

public interface IIntegrationService {
    IntegrationResponse create(IntegrationRequest request);
    IntegrationResponse getById(UUID integrationId);
    IntegrationResponse getByGroupId(UUID groupId);
    IntegrationResponse update(UUID integrationId, IntegrationRequest request);
    void delete(UUID integrationId);
    List<IntegrationResponse> getAll();
}
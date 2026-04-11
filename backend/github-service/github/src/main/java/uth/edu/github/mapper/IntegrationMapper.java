package uth.edu.github.mapper;

import org.springframework.stereotype.Component;
import uth.edu.github.dto.IntegrationRequest;
import uth.edu.github.dto.IntegrationResponse;
import uth.edu.github.model.Integration;

@Component
public class IntegrationMapper {

    public Integration toEntity(IntegrationRequest request) {
        return Integration.builder()
                .groupId(request.getGroupId())
                .githubToken(request.getGithubToken())
                .jiraProjectKey(request.getJiraProjectKey())
                .build();
    }

    public IntegrationResponse toResponse(Integration entity) {
        IntegrationResponse res = new IntegrationResponse();
        res.setIntegrationId(entity.getIntegrationId());
        res.setGroupId(entity.getGroupId());
        res.setGithubToken(entity.getGithubToken());
        res.setJiraProjectKey(entity.getJiraProjectKey());
        res.setCreatedAt(entity.getCreatedAt());
        return res;
    }
}
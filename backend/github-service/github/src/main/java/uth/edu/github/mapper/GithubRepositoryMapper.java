package uth.edu.github.mapper;

import org.springframework.stereotype.Component;
import uth.edu.github.dto.GithubRepositoryRequest;
import uth.edu.github.dto.GithubRepositoryResponse;
import uth.edu.github.model.GithubRepository;

@Component
public class GithubRepositoryMapper {

    public GithubRepository toEntity(GithubRepositoryRequest request) {
        return GithubRepository.builder()
                .groupId(request.getGroupId())
                .repoName(request.getRepoName())
                .repoUrl(request.getRepoUrl())
                .build();
    }

    public GithubRepositoryResponse toResponse(GithubRepository entity) {
        GithubRepositoryResponse res = new GithubRepositoryResponse();
        res.setRepoId(entity.getRepoId());
        res.setGroupId(entity.getGroupId());
        res.setRepoName(entity.getRepoName());
        res.setRepoUrl(entity.getRepoUrl());
        res.setCreatedAt(entity.getCreatedAt());
        return res;
    }
}
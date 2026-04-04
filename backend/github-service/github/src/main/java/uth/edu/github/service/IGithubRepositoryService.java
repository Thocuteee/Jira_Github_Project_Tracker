package uth.edu.github.service;

import uth.edu.github.dto.GithubRepositoryRequest;
import uth.edu.github.dto.GithubRepositoryResponse;
import java.util.List;
import java.util.UUID;

public interface IGithubRepositoryService {
    GithubRepositoryResponse create(GithubRepositoryRequest request);
    GithubRepositoryResponse getById(UUID repoId);
    List<GithubRepositoryResponse> getByGroupId(UUID groupId);
    GithubRepositoryResponse update(UUID repoId, GithubRepositoryRequest request);
    void delete(UUID repoId);
}
package uth.edu.github.service;

import uth.edu.github.dto.GithubCommitRequest;
import uth.edu.github.dto.GithubCommitResponse;
import uth.edu.github.model.GithubCommit;

import java.util.List;
import java.util.UUID;

public interface IGithubCommitService {
    GithubCommitResponse create(GithubCommitRequest request);
    GithubCommitResponse getById(UUID commitId);
    List<GithubCommitResponse> getByRepoId(UUID repoId);
    List<GithubCommitResponse> getByGroupId(UUID groupId);
    List<GithubCommitResponse> getByUserId(UUID userId);
    void delete(UUID commitId);
    void saveCommit(GithubCommit commit);
}
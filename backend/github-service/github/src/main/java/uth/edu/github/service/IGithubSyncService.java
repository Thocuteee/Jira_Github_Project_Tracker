package uth.edu.github.service;

import uth.edu.github.dto.GithubCommitResponse;
import java.util.List;
import java.util.UUID;

public interface IGithubSyncService {
    List<GithubCommitResponse> syncCommitsFromGithub(UUID groupId);
}

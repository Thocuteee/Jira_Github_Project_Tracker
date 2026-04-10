package uth.edu.github.service.impl;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import uth.edu.github.dto.GithubCommitRequest;
import uth.edu.github.dto.GithubCommitResponse;
import uth.edu.github.mapper.GithubCommitMapper;
import uth.edu.github.model.GithubCommit;
import uth.edu.github.model.GithubRepository;
import uth.edu.github.repository.GithubCommitRepo;
import uth.edu.github.repository.GithubRepositoryRepo;
import uth.edu.github.service.GithubMessagePublisher;
import uth.edu.github.service.IGithubCommitService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GithubCommitServiceImpl implements IGithubCommitService {

    private final GithubCommitRepo commitRepo;
    private final GithubRepositoryRepo repoRepo;
    private final GithubCommitMapper mapper;

    @Autowired 
    private GithubMessagePublisher githubMessagePublisher;

    @Override
    public GithubCommitResponse create(GithubCommitRequest request) {
        GithubRepository repo = repoRepo.findById(request.getRepoId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Repository!"));

        GithubCommit commit = GithubCommit.builder()
                .groupId(request.getGroupId())
                .repo(repo)
                .userId(request.getUserId())
                .commitHash(request.getCommitHash())
                .message(request.getMessage())
                .commitFile(request.getCommitFile())
                .build();

        return mapper.toResponse(commitRepo.save(commit));
    }

    @Override
    public GithubCommitResponse getById(UUID commitId) {
        return mapper.toResponse(commitRepo.findById(commitId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Commit!")));
    }

    @Override
    public List<GithubCommitResponse> getByRepoId(UUID repoId) {
        return commitRepo.findByRepo_RepoId(repoId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<GithubCommitResponse> getByGroupId(UUID groupId) {
        return commitRepo.findByGroupId(groupId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<GithubCommitResponse> getByUserId(UUID userId) {
        return commitRepo.findByUserId(userId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public void delete(UUID commitId) {
        if (!commitRepo.existsById(commitId))
            throw new RuntimeException("Không tìm thấy Commit!");
        commitRepo.deleteById(commitId);
    }

    @Override
    public void saveCommit(GithubCommit commit) {
        Map<String, Object> message = new HashMap<>();
        message.put("jiraKey", "PROJ-123"); 
        message.put("url", commit.getUrl());
        message.put("message", commit.getMessage());

        githubMessagePublisher.sendCommitSync(message);
    }
}
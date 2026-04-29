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
                .commitSha(request.getCommitHash())
                .message(request.getMessage())
                .commitFile(request.getCommitFile())
                .build();

        GithubCommit savedCommit = commitRepo.save(commit);

        try {
            saveCommit(savedCommit);
        } catch (Exception e) {
            System.err.println("Lỗi gửi message sang RabbitMQ: " + e.getMessage());
        }

        return mapper.toResponse(savedCommit);
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
        String messageText = commit.getMessage();
        if (messageText == null) return;
        
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("([A-Z]+-[0-9]+)");
        java.util.regex.Matcher matcher = pattern.matcher(messageText);
        
        String jiraKey = null;
        if (matcher.find()) {
            jiraKey = matcher.group(1);
        } else {
            System.out.println("Không tìm thấy mã Task Jira trong commit message. Bỏ qua gửi sang RabbitMQ.");
            return; 
        }

        Map<String, Object> message = new HashMap<>();
        message.put("jiraKey", jiraKey); 
        message.put("url", commit.getUrl());
        message.put("message", commit.getMessage());

        githubMessagePublisher.sendCommitSync(message);
    }
}
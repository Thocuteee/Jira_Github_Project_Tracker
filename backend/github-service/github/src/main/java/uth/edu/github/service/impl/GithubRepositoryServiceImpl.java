package uth.edu.github.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import uth.edu.github.dto.GithubRepositoryRequest;
import uth.edu.github.dto.GithubRepositoryResponse;
import uth.edu.github.mapper.GithubRepositoryMapper;
import uth.edu.github.model.GithubRepository;
import uth.edu.github.repository.GithubRepositoryRepo;
import uth.edu.github.service.IGithubRepositoryService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GithubRepositoryServiceImpl implements IGithubRepositoryService {

    private final GithubRepositoryRepo repoRepo;
    private final GithubRepositoryMapper mapper;

    @Override
    public GithubRepositoryResponse create(GithubRepositoryRequest request) {
        GithubRepository entity = mapper.toEntity(request);
        return mapper.toResponse(repoRepo.save(entity));
    }

    @Override
    public GithubRepositoryResponse getById(UUID repoId) {
        GithubRepository entity = repoRepo.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Repository!"));
        return mapper.toResponse(entity);
    }

    @Override
    public List<GithubRepositoryResponse> getByGroupId(UUID groupId) {
        return repoRepo.findByGroupId(groupId)
                .stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public GithubRepositoryResponse update(UUID repoId, GithubRepositoryRequest request) {
        GithubRepository entity = repoRepo.findById(repoId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Repository!"));
        entity.setRepoName(request.getRepoName());
        entity.setRepoUrl(request.getRepoUrl());
        return mapper.toResponse(repoRepo.save(entity));
    }

    @Override
    public void delete(UUID repoId) {
        if (!repoRepo.existsById(repoId))
            throw new RuntimeException("Không tìm thấy Repository!");
        repoRepo.deleteById(repoId);
    }
}
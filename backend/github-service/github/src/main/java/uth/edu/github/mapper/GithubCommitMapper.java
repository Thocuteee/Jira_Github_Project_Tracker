package uth.edu.github.mapper;

import org.springframework.stereotype.Component;
import uth.edu.github.dto.GithubCommitResponse;
import uth.edu.github.model.GithubCommit;

@Component
public class GithubCommitMapper {

    public GithubCommitResponse toResponse(GithubCommit entity) {
        GithubCommitResponse res = new GithubCommitResponse();
        res.setCommitId(entity.getCommitId());
        res.setGroupId(entity.getGroupId());
        res.setRepoId(entity.getRepo() != null ? entity.getRepo().getRepoId() : null);
        res.setRepoName(entity.getRepo() != null ? entity.getRepo().getRepoName() : "N/A");
        res.setUserId(entity.getUserId());
        res.setCommitHash(entity.getCommitSha());
        res.setMessage(entity.getMessage());
        res.setCommitFile(entity.getCommitFile());
        res.setAuthorName(entity.getAuthorName());
        res.setCommittedAt(entity.getCommittedAt());
        return res;
    }
}
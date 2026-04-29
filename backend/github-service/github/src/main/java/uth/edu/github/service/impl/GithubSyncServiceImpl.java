package uth.edu.github.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import uth.edu.github.dto.GithubCommitResponse;
import uth.edu.github.mapper.GithubCommitMapper;
import uth.edu.github.model.GithubCommit;
import uth.edu.github.model.GithubRepository;
import uth.edu.github.model.Integration;
import uth.edu.github.repository.GithubCommitRepo;
import uth.edu.github.repository.GithubRepositoryRepo;
import uth.edu.github.repository.IntegrationRepo;
import uth.edu.github.service.IGithubSyncService;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GithubSyncServiceImpl implements IGithubSyncService {

    private final IntegrationRepo integrationRepo;
    private final GithubRepositoryRepo repoRepo;
    private final GithubCommitRepo commitRepo;
    private final GithubCommitMapper mapper;
    private final ObjectMapper objectMapper;

    @Override
    public List<GithubCommitResponse> syncCommitsFromGithub(UUID groupId) {
        // 1. Lấy thông tin integration (token + repo) của group
        Integration integration = integrationRepo.findFirstByGroupId(groupId)
                .orElseThrow(() -> new RuntimeException(
                        "Chưa cấu hình GitHub Integration cho Group này. Vui lòng vào Trung tâm Tích hợp để cấu hình."));

        String githubRepo = integration.getGithubRepo();
        String githubToken = integration.getGithubToken();

        if (githubRepo == null || githubRepo.isBlank()) {
            throw new RuntimeException("Chưa cấu hình GitHub Repository cho Group này.");
        }

        String repoPath = parseRepoPath(githubRepo);

        // 2. Tìm hoặc tạo GithubRepository trong DB
        List<GithubRepository> repos = repoRepo.findByGroupId(groupId);
        GithubRepository repo;
        if (repos.isEmpty()) {
            repo = GithubRepository.builder()
                    .groupId(groupId)
                    .repoName(repoPath)
                    .repoUrl("https://github.com/" + repoPath)
                    .build();
            repo = repoRepo.save(repo);
        } else {
            repo = repos.get(0);
            if (!repoPath.equals(repo.getRepoName())) {
                repo.setRepoName(repoPath);
                repo.setRepoUrl("https://github.com/" + repoPath);
                repo = repoRepo.save(repo);
            }
        }

        // 3. Gọi GitHub REST API lấy toàn bộ commit (Sử dụng phân trang)
        List<GithubCommitResponse> saved = new ArrayList<>();
        int page = 1;
        boolean hasMore = true;
        RestTemplate restTemplate = new RestTemplate();

        while (hasMore) {
            String apiUrl = "https://api.github.com/repos/" + repoPath + "/commits?per_page=100&page=" + page;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/vnd.github+json");
            headers.set("X-GitHub-Api-Version", "2022-11-28");
            if (githubToken != null && !githubToken.isBlank()) {
                headers.set("Authorization", "Bearer " + githubToken);
            }

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response;
            try {
                System.out.println("Calling GitHub API Page " + page + ": " + apiUrl);
                response = restTemplate.exchange(apiUrl, HttpMethod.GET, entity, String.class);
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                String errorBody = e.getResponseBodyAsString();
                System.err.println("GitHub API Error (" + e.getStatusCode() + "): " + errorBody);
                throw new RuntimeException("GitHub API trả về lỗi " + e.getStatusCode() + ": " + errorBody);
            } catch (Exception e) {
                System.err.println("GitHub Connection Error: " + e.getMessage());
                throw new RuntimeException("Lỗi kết nối GitHub API: " + e.getMessage());
            }

            if (response.getBody() == null || response.getBody().equals("[]")) {
                hasMore = false;
                continue;
            }

            // 4. Parse JSON và lưu commit mới vào DB
            try {
                JsonNode commits = objectMapper.readTree(response.getBody());
                if (!commits.isArray() || commits.size() == 0) {
                    hasMore = false;
                    continue;
                }

                GithubRepository finalRepo = repo;
                for (JsonNode commitNode : commits) {
                    String sha = commitNode.path("sha").asText();
                    if (sha.isBlank()) continue;

                    // Bỏ qua nếu commit đã tồn tại trong group này
                    if (commitRepo.existsByCommitShaAndGroupId(sha, groupId)) continue;

                    JsonNode commitDetail = commitNode.path("commit");
                    String message    = commitDetail.path("message").asText();
                    String dateStr    = commitDetail.path("author").path("date").asText();
                    String authorName = commitDetail.path("author").path("name").asText();

                    LocalDateTime committedAt = LocalDateTime.now();
                    if (!dateStr.isBlank()) {
                        try {
                            committedAt = OffsetDateTime.parse(dateStr).toLocalDateTime();
                        } catch (Exception ignored) {}
                    }

                    GithubCommit commitEntity = GithubCommit.builder()
                            .groupId(groupId)
                            .repo(finalRepo)
                            .userId(groupId)          
                            .commitSha(sha)
                            .message(message)
                            .authorName(authorName)   
                            .committedAt(committedAt)
                            .build();

                    saved.add(mapper.toResponse(commitRepo.save(commitEntity)));
                }
                
                // Nếu trang này ít hơn 100 commit nghĩa là đã hết sạch
                if (commits.size() < 100) {
                    hasMore = false;
                } else {
                    page++; // Sang trang tiếp theo
                }

            } catch (Exception e) {
                throw new RuntimeException("Lỗi xử lý dữ liệu commit từ GitHub: " + e.getMessage());
            }
        }

        return saved;
    }

    private String parseRepoPath(String input) {
        String cleaned = input.trim();
        if (cleaned.startsWith("https://github.com/")) {
            cleaned = cleaned.replace("https://github.com/", "");
        } else if (cleaned.startsWith("http://github.com/")) {
            cleaned = cleaned.replace("http://github.com/", "");
        }
        return cleaned.replaceAll("\\.git$", "").replaceAll("/$", "");
    }
}

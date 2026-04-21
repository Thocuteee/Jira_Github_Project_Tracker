package uth.edu.jira.service;

import com.atlassian.jira.rest.client.api.JiraRestClient;
import com.atlassian.jira.rest.client.internal.async.AsynchronousJiraRestClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import uth.edu.jira.model.GlobalJiraSetting;
import uth.edu.jira.repository.GlobalJiraSettingRepository;

import java.net.URI;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class JiraClientProvider {

    private final GlobalJiraSettingRepository settingRepository;

    @Value("${jira.url}")
    private String defaultUrl;

    @Value("${jira.username}")
    private String defaultUsername;

    @Value("${jira.api-token}")
    private String defaultToken;

    private JiraRestClient currentClient;
    private String currentUrl;
    private String currentUsername;
    private String currentToken;

    public JiraRestClient getClient() {
        if (currentClient == null) {
            refreshClient();
        }
        return currentClient;
    }

    public void refreshClient() {
        List<GlobalJiraSetting> settings = settingRepository.findAll();
        
        String url = defaultUrl;
        String username = defaultUsername;
        String token = defaultToken;

        if (!settings.isEmpty()) {
            GlobalJiraSetting latest = settings.get(settings.size() - 1);
            url = latest.getJiraUrl();
            username = latest.getJiraUsername();
            token = latest.getJiraApiToken();
            log.info("Using dynamic Jira settings from database: URL={}", url);
        } else {
            log.info("Using default Jira settings from properties");
        }

        this.currentUrl = url;
        this.currentUsername = username;
        this.currentToken = token;

        try {
            if (currentClient != null) {
                currentClient.close();
            }
            currentClient = new AsynchronousJiraRestClientFactory()
                    .createWithBasicHttpAuthentication(
                            URI.create(url),
                            username,
                            token
                    );
        } catch (Exception e) {
            log.error("Failed to create JiraRestClient: {}", e.getMessage());
            throw new RuntimeException("Lỗi khởi tạo kết nối Jira: " + e.getMessage());
        }
    }

    public String getBaseUrl() {
        return currentUrl != null ? currentUrl : defaultUrl;
    }

    public String getUsername() {
        return currentUsername != null ? currentUsername : defaultUsername;
    }

    public String getToken() {
        return currentToken != null ? currentToken : defaultToken;
    }
}

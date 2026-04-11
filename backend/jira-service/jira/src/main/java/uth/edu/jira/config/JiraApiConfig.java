package uth.edu.jira.config;

import com.atlassian.jira.rest.client.api.JiraRestClient;
import com.atlassian.jira.rest.client.internal.async.AsynchronousJiraRestClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.net.URI;

@Configuration
public class JiraApiConfig {

    @Value("${jira.url}")
    private String jiraUrl;

    @Value("${jira.username}")
    private String jiraUsername;

    @Value("${jira.api-token}")
    private String jiraApiToken;

    @Bean
    public JiraRestClient jiraRestClient() {
        return new AsynchronousJiraRestClientFactory()
                .createWithBasicHttpAuthentication(
                        URI.create(jiraUrl),
                        jiraUsername,
                        jiraApiToken
                );
    }
}
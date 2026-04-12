package uth.edu.task.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${cloudflare.r2.endpoint}")
    private String endpoint;

    @Value("${cloudflare.r2.access-key}")
    private String accessKey;

    @Value("${cloudflare.r2.secret-key}")
    private String secretKey;

    @Bean
    public S3Presigner s3Presigner() {
        String finalEndpoint = (endpoint == null || endpoint.isBlank()) ? "https://dummy-endpoint.com" : endpoint;
        String finalAccessKey = (accessKey == null || accessKey.isBlank()) ? "dummy-access-key" : accessKey;
        String finalSecretKey = (secretKey == null || secretKey.isBlank()) ? "dummy-secret-key" : secretKey;

        return S3Presigner.builder()
                .endpointOverride(URI.create(finalEndpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(finalAccessKey, finalSecretKey)
                ))
                .build();
    }

}

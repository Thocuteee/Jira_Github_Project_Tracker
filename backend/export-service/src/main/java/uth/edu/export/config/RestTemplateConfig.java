package uth.edu.export.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {
    // bao cho Spring Boot biet hay tao mot bean RestTemplate de su dung trong cac service khi can goi API ngoai, nhu goi API cua Requirement Service de lay requirement snapshot khi tao export moi, hay goi API cua Cloud Storage Service de upload file sau khi tao xong va lay URL tra ve
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}

package uth.edu.task.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import feign.codec.Encoder;
import feign.form.spring.SpringFormEncoder;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Configuration
public class FeignConfig {

    @Bean
    public Encoder multipartFormEncoder() {
        return new SpringFormEncoder(new SpringEncoder(
                () -> new HttpMessageConverters(new RestTemplate().getMessageConverters())));
    }

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                UUID userId = UserContextHolder.getUserId();
                String role = UserContextHolder.getUserRole();

                if (userId != null) {
                    template.header("X-User-Id", userId.toString());
                }

                if (role != null) {
                    template.header("X-User-Role", role);
                }
            }
        };
    }
}

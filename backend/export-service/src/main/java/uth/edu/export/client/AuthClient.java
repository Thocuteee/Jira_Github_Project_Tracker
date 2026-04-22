package uth.edu.export.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import uth.edu.export.dto.response.UserInfoResponse;

@FeignClient(name = "auth-service", url = "${app.auth-service.url:http://auth-service:8081}")
public interface AuthClient {

    @GetMapping("/api/auth/users/{id}")
    UserInfoResponse getUserById(@PathVariable("id") UUID id);
}

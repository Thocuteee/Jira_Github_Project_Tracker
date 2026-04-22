package uth.edu.export.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import uth.edu.export.dto.response.GroupInfoResponse;

@FeignClient(name = "group-service", url = "${app.group-service.url:http://group-service:8082}")
public interface GroupClient {

    @GetMapping("/api/groups/{id}")
    GroupInfoResponse getGroupById(@PathVariable("id") UUID id);
}

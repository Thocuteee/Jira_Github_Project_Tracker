package uth.edu.task.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import uth.edu.task.dto.response.external.RequirementResponse;

import java.util.UUID;

@FeignClient(name = "requirement-service", url = "${app.requirement-service.url:http://requirement-service:8080}")
public interface RequirementClient {

    @GetMapping("/api/requirements/{id}")
    RequirementResponse getRequirementById(@PathVariable("id") UUID id);
}

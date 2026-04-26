package uth.edu.export.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.UUID;
import java.util.List;

@FeignClient(name = "requirement-service", url = "${app.requirement-service.url:http://requirement-service:8083}")
public interface RequirementClient {
    @GetMapping("/api/requirements/group/{groupId}")
    String getRequirementsByGroupId(@PathVariable("groupId") UUID groupId);

    @PostMapping("/api/requirements/list")
    String getRequirementsByIds(@RequestBody List<UUID> ids);
}
package uth.edu.export.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.UUID;
import java.util.List;

@FeignClient(name = "requirement-service", url = "http://localhost:8083/api/requirements")
public interface RequirementClient {
    @GetMapping("/group/{groupId}")
    String getRequirementsByGroupId(@PathVariable("groupId") UUID groupId);

    @PostMapping("/list")
    String getRequirementsByIds(@RequestBody List<UUID> ids);
}
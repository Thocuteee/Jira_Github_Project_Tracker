package uth.edu.export.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.UUID;

@FeignClient(name = "requirement-service", url = "http://localhost:8083/api/requirements")
public interface RequirementClient {
    @GetMapping("/group/{groupId}")
    String getRequirementsByGroupId(@PathVariable("groupId") UUID groupId);
}
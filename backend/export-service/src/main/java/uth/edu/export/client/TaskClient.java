package uth.edu.export.client;

import java.util.List;
import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "task-service", url = "${app.task-service.url:http://task-service:8084}")
public interface TaskClient {

    @PostMapping(value = "/api/tasks/by-requirements", consumes = "application/json")
    String getTasksByRequirementIds(@RequestBody List<UUID> requirementIds);

    @PostMapping(value = "/api/tasks/comments/by-tasks", consumes = "application/json")
    String getCommentsByTaskIds(@RequestBody List<UUID> taskIds);
}

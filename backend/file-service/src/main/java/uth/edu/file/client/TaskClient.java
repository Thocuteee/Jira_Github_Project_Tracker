package uth.edu.file.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import uth.edu.file.dto.external.TaskSummary;

import java.util.UUID;

@FeignClient(
        name = "task-service",
        url = "${app.task-service.url:http://task-service:8084}",
        configuration = FeignConfig.class
)
public interface TaskClient {

    @GetMapping("/api/tasks/{taskId}")
    TaskSummary getTask(@PathVariable("taskId") UUID taskId);
}

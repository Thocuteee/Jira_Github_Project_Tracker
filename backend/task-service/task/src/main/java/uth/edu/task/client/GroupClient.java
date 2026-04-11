package uth.edu.task.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import uth.edu.task.dto.response.external.GroupMemberResponse;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "group-service", url = "${app.group-service.url:http://group-service:8082}")
public interface GroupClient {

    @GetMapping("/api/groups/{groupId}/members")
    List<GroupMemberResponse> getGroupMembers(@PathVariable("groupId") UUID groupId);
}

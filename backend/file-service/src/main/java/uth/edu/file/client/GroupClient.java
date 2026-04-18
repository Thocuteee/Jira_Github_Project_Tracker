package uth.edu.file.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import uth.edu.file.dto.external.GroupMemberDto;

import java.util.List;
import java.util.UUID;

@FeignClient(
        name = "group-service",
        url = "${app.group-service.url:http://group-service:8082}",
        configuration = FeignConfig.class
)
public interface GroupClient {

    @GetMapping("/api/groups/{groupId}/members")
    List<GroupMemberDto> getGroupMembers(@PathVariable("groupId") UUID groupId);
}

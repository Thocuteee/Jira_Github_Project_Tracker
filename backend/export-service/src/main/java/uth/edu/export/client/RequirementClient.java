package uth.edu.export.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class RequirementClient {

    private final RestTemplate restTemplate;
    private final String REQUIREMENT_URL = "http://localhost:8082/api/requirements/group/";

    public String getRequirementsByGroupId(UUID groupId) {
        try {
            log.info("Đang gọi sang Requirement Service: {}{}", REQUIREMENT_URL, groupId);
            // goi API
            return restTemplate.getForObject(REQUIREMENT_URL + groupId, String.class);
        } catch (Exception e) {
            log.warn("Không kết nối được Requirement Service. Đang dùng dữ liệu giả để test!");
            // tra ve du lieu gia de test, sau nay se xoa di khi da co API thuc su cua Requirement Service
            return "[{\"reqId\":\"1\", \"title\":\"Chức năng Đăng nhập\"}, {\"reqId\":\"2\", \"title\":\"Chức năng Export\"}]";
        }
    }
}
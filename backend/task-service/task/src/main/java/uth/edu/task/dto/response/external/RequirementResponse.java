package uth.edu.task.dto.response.external;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequirementResponse {
    private String requirementId;
    private String groupId;
    private String title;
    private String description;
    private String createdBy;
    private String createdAt;
    private String priority;
    private String status;
    private String jiraIssueKey;
}

package uth.edu.requirement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
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
}

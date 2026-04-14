package uth.edu.requirement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequirementRequest {

    private String groupId;
    private String title;
    private String description;
    private String createdBy;
    private String priority;
    private String status;
    private String jiraIssueKey;
}
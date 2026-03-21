package uth.edu.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequirementRequest {
    private String title;
    private String content;
    private String status;
    private String projectId;
    private String createdBy;
}
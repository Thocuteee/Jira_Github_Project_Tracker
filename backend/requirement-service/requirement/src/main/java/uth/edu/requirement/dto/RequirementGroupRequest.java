package uth.edu.requirement.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequirementGroupRequest {
    private String groupName;
    private String description;

    public String getGroupName() {
        return groupName;
    }

    public String getDescription() {
        return description;
    }
}
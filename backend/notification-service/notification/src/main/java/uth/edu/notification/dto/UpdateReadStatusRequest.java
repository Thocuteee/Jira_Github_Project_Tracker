package uth.edu.notification.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReadStatusRequest {
    @NotNull
    private Boolean isRead;
}

package uth.edu.group.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GroupDeletedEvent {
    private UUID groupId;
    private LocalDateTime deletedAt;
}

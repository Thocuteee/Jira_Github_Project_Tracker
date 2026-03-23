package uth.edu.group.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GroupMember {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID memberId;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(nullable = false)
    private UUID userId;

    private String roleInGroup;

    private LocalDateTime joinedAt = LocalDateTime.now();
}
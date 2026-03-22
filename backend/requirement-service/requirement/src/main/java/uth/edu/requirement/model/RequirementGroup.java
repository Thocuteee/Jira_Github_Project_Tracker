package uth.edu.requirement.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "requirement_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequirementGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "group_id", nullable = false, updatable = false)
    private UUID groupId;

    @Column(name = "group_name", nullable = false, length = 255)
    private String groupName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Requirement> requirements = new ArrayList<>();
}



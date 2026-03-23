package com.example.report.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "groups")
@Data
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID groupId;

    private String groupName;
}
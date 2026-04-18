package uth.edu.auth.model;

import jakarta.persistence.*;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;
import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;   
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "userId")
    @EqualsAndHashCode.Include
    private UUID userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles", 
        joinColumns = @JoinColumn(name = "user_id"), 
        inverseJoinColumns = @JoinColumn(name = "role_id") 
    )
    private Set<Role> roles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

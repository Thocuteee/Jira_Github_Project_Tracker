package uth.edu.requirement.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import uth.edu.requirement.model.RequirementGroup;
import uth.edu.requirement.model.Requirement;
import java.util.List;

import java.util.UUID;

@Repository
public interface RequirementGroupRepository extends JpaRepository<RequirementGroup, UUID> {
}

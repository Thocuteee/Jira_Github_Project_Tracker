# MVP Integration Contracts

## API Path Contracts
- Auth: `/api/auth/**`
- Groups: `/api/groups/**`
- Requirements: `/api/requirements/**`
- Tasks: `/api/tasks/**`
- Reports: `/api/reports/**`
- Notifications: `/api/notifications/**`
- GitHub: `/api/github/**`
- Jira: `/api/jira/**`
- Exports: `/api/exports/**`
- Files: `/api/files/**`

## Event/Data Contracts (Core)
- IDs across services are UUID strings.
- Cross-service linkage must store foreign IDs as plain UUID fields (no JPA cross-service FK).
- Commit sync message must include:
  - `jiraKey`
  - `url`
  - `message`

## Contract Hardening Rules
- New routes must be added simultaneously in:
  - gateway route config
  - frontend API service constants
  - smoke checklist
- Jira key extraction from commit messages uses uppercase format `PROJECT-123`.
- Duplicate commit hashes are rejected at service layer and database uniqueness.

## Consistency Checks Before Merge
- [ ] Gateway route exists for every frontend API namespace.
- [ ] No frontend code references deprecated singular export path `/api/export`.
- [ ] DTO/request payload fields align with backend request models.
- [ ] Enum values used by frontend match backend serialized values.

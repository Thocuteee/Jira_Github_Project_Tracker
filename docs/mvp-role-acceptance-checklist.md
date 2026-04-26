# MVP Role Acceptance Checklist

## Purpose
Acceptance checklist for the 4 primary actors in the local MVP.

## Preconditions
- Stack running by `docker compose ... up -d --build`.
- Real credentials configured for OAuth, Jira, GitHub, FCM/Resend, and R2.
- Test users available for each role.

## Admin Flow
- [ ] Login as Admin.
- [ ] Create group and assign lecturer.
- [ ] Configure Jira integration for the group.
- [ ] Configure GitHub integration for the group.
- [ ] Verify integration status is visible and persisted.

## Lecturer Flow
- [ ] Login as Lecturer.
- [ ] View assigned groups.
- [ ] View requirements and tasks of one assigned group.
- [ ] View progress metrics.
- [ ] View GitHub contribution summary for the group.

## Team Leader Flow
- [ ] Login as Team Leader.
- [ ] Create/update requirement.
- [ ] Create task from requirement and assign to member.
- [ ] Trigger export SRS and verify artifact availability.
- [ ] Receive notification (push/email) when tracked event occurs.

## Team Member Flow
- [ ] Login as Team Member.
- [ ] View own assigned tasks.
- [ ] Update task status.
- [ ] Submit commit linked to Jira key format (`ABC-123`).
- [ ] Verify personal contribution stats are updated.

## Integration-Specific Verifications
- [ ] Jira sync endpoint stores issue data and status mapping is valid.
- [ ] GitHub commit ingestion publishes sync message and persists commit metadata.
- [ ] Notification service sends FCM when token exists.
- [ ] Notification service sends email when Resend is enabled.
- [ ] File upload/download works with R2.

## Done Criteria
- [ ] All role flows pass without manual DB patching.
- [ ] No service enters degraded mode due to missing/invalid integration credentials.
- [ ] No endpoint contract mismatch between frontend and gateway paths.

# MVP Auth and Role Matrix

## Role-to-Capability Matrix

| Capability | Admin | Lecturer | TeamLeader | TeamMember |
|---|---|---|---|---|
| Manage groups | Yes | No | Limited (own group) | No |
| Assign lecturer | Yes | No | No | No |
| Configure Jira/GitHub integration | Yes | No | Yes (own group) | No |
| Manage requirements | No | View | Yes | View |
| Manage tasks | No | View | Yes | Update own |
| View group progress | Yes | Yes | Yes | Limited |
| View contribution stats | Yes | Yes | Yes | Own only |
| Export SRS/report | Yes | View | Yes | No |

## OAuth Configuration Checklist
- [ ] Google OAuth app callback points to local auth callback route.
- [ ] GitHub OAuth app callback points to local auth callback route.
- [ ] Auth service uses non-empty client IDs/secrets in local env.
- [ ] Gateway forwards auth callbacks correctly through nginx.

## JWT Checklist
- [ ] `JWT_SECRET` is non-default and long enough.
- [ ] Access token expiration and refresh expiration configured.
- [ ] Protected routes return `401` without token and `200/2xx` with valid token.

## Manual Verification
1. Login with local account (password flow).
2. Login with Google OAuth.
3. Login with GitHub OAuth.
4. Access one protected endpoint per role and verify authorization behavior.

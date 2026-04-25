export type GroupRole = 'LEADER' | 'MEMBER' | 'LECTURER' | 'ADMIN' | 'UNKNOWN';

const ROLE_PREFIX_REGEX = /^(ROLE_TEAM_|ROLE_|TEAM_)/i;

export const normalizeGroupRole = (role?: string | null): GroupRole => {
  if (!role) return 'UNKNOWN';

  const cleaned = String(role).trim().toUpperCase().replace(ROLE_PREFIX_REGEX, '');
  if (!cleaned) return 'UNKNOWN';

  if (cleaned === 'LEADER') return 'LEADER';
  if (cleaned === 'MEMBER') return 'MEMBER';
  if (cleaned === 'LECTURER') return 'LECTURER';
  if (cleaned === 'ADMIN') return 'ADMIN';
  if (cleaned === 'TEAM_LEADER') return 'LEADER';
  if (cleaned === 'TEAM_MEMBER') return 'MEMBER';

  return 'UNKNOWN';
};

export const getMemberRole = (member: { roleInGroup?: string | null; role?: string | null }): GroupRole =>
  normalizeGroupRole(member.roleInGroup || member.role);

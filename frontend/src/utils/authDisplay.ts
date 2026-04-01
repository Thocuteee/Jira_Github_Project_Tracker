export const toDisplayRole = (role?: string): string => {
  if (!role) return 'Role'

  const cleaned = role.replace(/^ROLE_/i, '').replace(/_/g, ' ').trim()
  if (!cleaned) return 'Role'

  return cleaned
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export const getPrimaryRole = (roles?: string[]): string => {
  if (!roles?.length) return 'Role'
  return toDisplayRole(roles[0])
}

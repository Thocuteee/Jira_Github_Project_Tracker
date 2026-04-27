import authService from '@/api/auth.service';
import { getPrimaryRole } from '@/utils/authDisplay';

export async function hydrateSessionProfileFromApi(): Promise<void> {
  const profile = await authService.getProfile();
  if (!profile) {
    return;
  }

  const normalizedName = profile.fullName || profile.name || localStorage.getItem('userName') || '';
  if (normalizedName) {
    localStorage.setItem('userName', normalizedName);
  }
  if (profile.email) {
    localStorage.setItem('userEmail', profile.email);
  }
  if (Array.isArray(profile.roles)) {
    localStorage.setItem('userRoles', JSON.stringify(profile.roles));
    localStorage.setItem('userSubtitle', getPrimaryRole(profile.roles));
  }
  if (profile.userId) {
    localStorage.setItem('userId', profile.userId);
  }
  localStorage.setItem('userAvatarUrl', profile.avatarUrl || '');
}

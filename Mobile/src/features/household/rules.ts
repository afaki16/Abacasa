// Davet ve üye işlemlerinin uygunluk kuralları (web household sayfası ve backend ile aynı). Saf; testlidir.

import type { HouseholdInvitation, HouseholdMember } from './types';

/** Bekleyen ya da süresi dolmuş davet yeniden gönderilebilir (yeni token, yeni 7 gün). */
export const canResendInvitation = (invitation: Pick<HouseholdInvitation, 'status'>): boolean =>
  invitation.status === 'Pending' || invitation.status === 'Expired';

/** Yalnızca bekleyen davet iptal edilebilir. */
export const canRevokeInvitation = (invitation: Pick<HouseholdInvitation, 'status'>): boolean =>
  invitation.status === 'Pending';

/** Hanede her zaman en az bir yönetici kalır: tek yönetici rolünü düşüremez / çıkarılamaz / ayrılamaz. */
export const isLastAdmin = (members: Pick<HouseholdMember, 'membershipId' | 'role'>[], membershipId: number): boolean => {
  const admins = members.filter((m) => m.role === 'Admin');
  return admins.length === 1 && admins[0].membershipId === membershipId;
};

/** Kendini çıkarmak yerine "ayrıl" kullanılır; son üye ve son yönetici ayrılamaz. */
export const canLeaveHousehold = (members: Pick<HouseholdMember, 'membershipId' | 'role' | 'isCurrentUser'>[]): boolean => {
  const me = members.find((m) => m.isCurrentUser);
  if (!me || members.length <= 1) return false;
  return !isLastAdmin(members, me.membershipId);
};

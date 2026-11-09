// Hane ve üyeler ekranının görünüm yardımcıları: üye sırası, davet listesi, kalan gün, ayrılma engeli. Saf; testlidir.

import type { HouseholdInvitation, HouseholdMember } from './types';
import { isLastAdmin } from './rules';

const DAY = 86_400_000;

/** Sen önce, sonra yöneticiler, sonra ada göre (Türkçe sıralama). */
export function sortMembers<T extends Pick<HouseholdMember, 'isCurrentUser' | 'role' | 'fullName'>>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    if (a.isCurrentUser !== b.isCurrentUser) return a.isCurrentUser ? -1 : 1;
    if (a.role !== b.role) return a.role === 'Admin' ? -1 : 1;
    return a.fullName.localeCompare(b.fullName, 'tr-TR');
  });
}

/** Ekranda gösterilen davetler: bekleyenler ve süresi dolmuşlar (yeniden gönderilebilir). */
export function visibleInvitations<T extends Pick<HouseholdInvitation, 'status'>>(invitations: T[]): T[] {
  return invitations.filter((i) => i.status === 'Pending' || i.status === 'Expired');
}

/** Bekleyen ve süresi geçmemiş davet sayısı (başlık kartı). */
export function pendingInvitationCount(
  invitations: Pick<HouseholdInvitation, 'status' | 'expiresAt'>[],
  now: number = Date.now(),
): number {
  return invitations.filter((i) => i.status === 'Pending' && Date.parse(i.expiresAt) > now).length;
}

/** Süresi dolmuş sayılır mı (sunucu henüz Expired işaretlememiş olabilir). */
export function isInvitationExpired(
  invitation: Pick<HouseholdInvitation, 'status' | 'expiresAt'>,
  now: number = Date.now(),
): boolean {
  return invitation.status === 'Expired' || (invitation.status === 'Pending' && Date.parse(invitation.expiresAt) <= now);
}

/** Kalan gün (yukarı yuvarlanır; ör. 4,2 gün → 5); süresi geçtiyse 0. */
export function invitationDaysLeft(expiresAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / DAY));
}

/** Haneden ayrılamama nedeni (null: ayrılabilir). Son üye haneyi silebilir; son yönetici önce yönetici atar. */
export function leaveBlockReason(
  members: Pick<HouseholdMember, 'membershipId' | 'role' | 'isCurrentUser'>[],
): 'soleMember' | 'lastAdmin' | null {
  const me = members.find((m) => m.isCurrentUser);
  if (!me) return null;
  if (members.length <= 1) return 'soleMember';
  return isLastAdmin(members, me.membershipId) ? 'lastAdmin' : null;
}

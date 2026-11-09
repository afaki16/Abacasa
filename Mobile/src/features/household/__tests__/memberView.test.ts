import {
  invitationDaysLeft,
  isInvitationExpired,
  leaveBlockReason,
  pendingInvitationCount,
  sortMembers,
  visibleInvitations,
} from '../memberView';
import type { HouseholdRole } from '@/lib/domain/enums';

const NOW = Date.parse('2026-11-08T12:00:00Z');

const member = (membershipId: number, role: HouseholdRole, fullName: string, isCurrentUser = false) => ({
  membershipId,
  role,
  fullName,
  isCurrentUser,
});

describe('sortMembers', () => {
  it('sen önce, sonra yöneticiler, sonra ada göre', () => {
    const sorted = sortMembers([
      member(1, 'Member', 'Zeynep'),
      member(2, 'Admin', 'Mehmet'),
      member(3, 'Member', 'Ayşe', true),
      member(4, 'Member', 'Çiğdem'),
    ]);
    expect(sorted.map((m) => m.membershipId)).toEqual([3, 2, 4, 1]);
  });
});

describe('davetler', () => {
  const invitations = [
    { status: 'Pending' as const, expiresAt: '2026-11-13T09:00:00Z' },
    { status: 'Pending' as const, expiresAt: '2026-11-08T11:00:00Z' },
    { status: 'Expired' as const, expiresAt: '2026-11-01T00:00:00Z' },
    { status: 'Accepted' as const, expiresAt: '2026-11-20T00:00:00Z' },
    { status: 'Revoked' as const, expiresAt: '2026-11-20T00:00:00Z' },
  ];

  it('yalnızca bekleyen ve süresi dolanlar listelenir', () => {
    expect(visibleInvitations(invitations).map((i) => i.status)).toEqual(['Pending', 'Pending', 'Expired']);
  });

  it('bekleyen sayısı süresi geçmişi saymaz', () => {
    expect(pendingInvitationCount(invitations, NOW)).toBe(1);
  });

  it('süresi geçen bekleyen davet dolmuş sayılır', () => {
    expect(isInvitationExpired(invitations[0], NOW)).toBe(false);
    expect(isInvitationExpired(invitations[1], NOW)).toBe(true);
    expect(isInvitationExpired(invitations[2], NOW)).toBe(true);
  });

  it('kalan gün yukarı yuvarlanır, geçmişte 0', () => {
    expect(invitationDaysLeft('2026-11-13T09:00:00Z', NOW)).toBe(5);
    expect(invitationDaysLeft('2026-11-15T12:00:00Z', NOW)).toBe(7);
    expect(invitationDaysLeft('2026-11-01T00:00:00Z', NOW)).toBe(0);
  });
});

describe('leaveBlockReason', () => {
  it('tek üye, son yönetici, serbest', () => {
    expect(leaveBlockReason([member(1, 'Admin', 'A', true)])).toBe('soleMember');
    expect(leaveBlockReason([member(1, 'Admin', 'A', true), member(2, 'Member', 'B')])).toBe('lastAdmin');
    expect(leaveBlockReason([member(1, 'Admin', 'A', true), member(2, 'Admin', 'B')])).toBeNull();
    expect(leaveBlockReason([member(1, 'Member', 'A', true), member(2, 'Admin', 'B')])).toBeNull();
  });
});

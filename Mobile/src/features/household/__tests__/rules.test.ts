import { canLeaveHousehold, canResendInvitation, canRevokeInvitation, isLastAdmin } from '../rules';
import type { HouseholdMember } from '../types';

type MemberLike = Pick<HouseholdMember, 'membershipId' | 'role' | 'isCurrentUser'>;

const member = (membershipId: number, role: 'Admin' | 'Member', isCurrentUser = false): MemberLike => ({
  membershipId,
  role,
  isCurrentUser,
});

describe('davet kuralları', () => {
  it.each([
    ['Pending', true, true],
    ['Expired', true, false],
    ['Accepted', false, false],
    ['Revoked', false, false],
  ] as const)('%s: yeniden gönder=%s, iptal=%s', (status, resend, revoke) => {
    expect(canResendInvitation({ status })).toBe(resend);
    expect(canRevokeInvitation({ status })).toBe(revoke);
  });
});

describe('isLastAdmin', () => {
  it('tek yönetici için true', () => {
    expect(isLastAdmin([member(1, 'Admin'), member(2, 'Member')], 1)).toBe(true);
  });

  it('birden fazla yönetici ya da üye için false', () => {
    expect(isLastAdmin([member(1, 'Admin'), member(2, 'Admin')], 1)).toBe(false);
    expect(isLastAdmin([member(1, 'Admin'), member(2, 'Member')], 2)).toBe(false);
  });
});

describe('canLeaveHousehold', () => {
  it('son üye ayrılamaz', () => {
    expect(canLeaveHousehold([member(1, 'Admin', true)])).toBe(false);
  });

  it('son yönetici ayrılamaz', () => {
    expect(canLeaveHousehold([member(1, 'Admin', true), member(2, 'Member')])).toBe(false);
  });

  it('üye ya da başka yöneticisi olan yönetici ayrılabilir', () => {
    expect(canLeaveHousehold([member(1, 'Admin'), member(2, 'Member', true)])).toBe(true);
    expect(canLeaveHousehold([member(1, 'Admin', true), member(2, 'Admin')])).toBe(true);
  });

  it('listede kendisi yoksa false', () => {
    expect(canLeaveHousehold([member(1, 'Admin'), member(2, 'Member')])).toBe(false);
  });
});

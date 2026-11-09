import { fireEvent, render, screen } from '@testing-library/react-native';

import type { HouseholdMember } from '../../types';
import { MemberActionsSheet } from '../MemberActionsSheet';

jest.mock('react-native-keyboard-controller', () => jest.requireActual('react-native-keyboard-controller/jest'));
jest.mock('react-native-safe-area-context', () => jest.requireActual<{ default: unknown }>('react-native-safe-area-context/jest/mock').default);
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}));
jest.mock('expo-router', () => ({ router: { dismissAll: jest.fn(), push: jest.fn() } }));

const mockMutation = () => ({ mutate: jest.fn(), reset: jest.fn(), isPending: false, error: null });
const mockUpdate = mockMutation();
const mockRemove = mockMutation();
const mockLeave = mockMutation();
jest.mock('../../hooks', () => ({
  useUpdateHouseholdMember: () => mockUpdate,
  useRemoveHouseholdMember: () => mockRemove,
  useLeaveHousehold: () => mockLeave,
}));
jest.mock('@/features/people/hooks', () => ({
  usePersonOptions: () => ({ data: [{ id: 7, name: 'Ayşe Yılmaz', relation: null, createdDate: '' }], isPending: false, error: null }),
}));

const base = { userId: 1, email: 'x@ornek.com', joinedAt: '2026-01-01', personId: null, personName: null };
const me: HouseholdMember = { ...base, membershipId: 1, fullName: 'Ahmet Yılmaz', role: 'Admin', isCurrentUser: true };
const ayse: HouseholdMember = { ...base, membershipId: 2, userId: 2, fullName: 'Ayşe Yılmaz', role: 'Member', isCurrentUser: false };

describe('MemberActionsSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tek yönetici kendi rolünü düşüremez ve ayrılamaz; nedeni gösterilir', async () => {
    await render(
      <MemberActionsSheet visible member={me} members={[me, ayse]} canUpdate canDelete onClose={jest.fn()} />,
    );

    expect(screen.getByText('Ahmet Yılmaz (sen)')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Üye rolüne geçir' })).toBeNull();
    expect(screen.getByLabelText(/Üye rolüne geçir\. Hanenin tek yöneticisisin/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Haneden ayrıl' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Haneden çıkar' })).toBeNull();
  });

  it('yönetici üyeyi yönetici yapar, onaylayıp haneden çıkarır', async () => {
    await render(
      <MemberActionsSheet visible member={ayse} members={[me, ayse]} canUpdate canDelete onClose={jest.fn()} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Yönetici yap' }));
    expect(mockUpdate.mutate).toHaveBeenCalledWith({ membershipId: 2, role: 'Admin', personId: null }, expect.anything());

    await fireEvent.press(screen.getByRole('button', { name: 'Haneden çıkar' }));
    expect(screen.getByText('Ayşe Yılmaz haneden çıkarılsın mı?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Haneden çıkar' }));
    expect(mockRemove.mutate).toHaveBeenCalledWith(2, expect.anything());
  });

  it('bağlı kişi seçilir', async () => {
    await render(
      <MemberActionsSheet visible member={ayse} members={[me, ayse]} canUpdate canDelete={false} onClose={jest.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Haneden çıkar' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Bağlı kişiyi değiştir' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Ayşe Yılmaz' }));
    expect(mockUpdate.mutate).toHaveBeenCalledWith({ membershipId: 2, role: 'Member', personId: 7 }, expect.anything());
  });

  it('izni olmayan üye kendi satırında yalnızca ayrılabilir', async () => {
    const self: HouseholdMember = { ...ayse, isCurrentUser: true };
    await render(
      <MemberActionsSheet visible member={self} members={[{ ...me, isCurrentUser: false }, self]} canUpdate={false} canDelete={false} onClose={jest.fn()} />,
    );
    expect(screen.queryByRole('button', { name: 'Bağlı kişiyi değiştir' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Yönetici yap' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Haneden ayrıl' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Ayrıl' }));
    expect(mockLeave.mutate).toHaveBeenCalled();
  });
});

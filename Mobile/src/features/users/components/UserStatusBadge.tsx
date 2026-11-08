import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import type { UserStatus } from '@/features/auth/types';

import { USER_STATUS_COLORS, USER_STATUS_LABELS } from '../constants';

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const color = USER_STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text variant="caption" color={color}>
        {USER_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
});

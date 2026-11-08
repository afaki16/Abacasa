import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { Radius, Spacing, useColors } from '@/constants/theme';
import type { UserStatus } from '@/features/auth/types';

import { USER_STATUS_COLORS } from '../constants';

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const { t } = useTranslation();
  const colors = useColors();
  const color = colors[USER_STATUS_COLORS[status]];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text variant="caption" color={color}>
        {t(`users.status.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

// Renk temadan, satır içinde verilir; buradaki stiller renksiz.
const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1 },
});

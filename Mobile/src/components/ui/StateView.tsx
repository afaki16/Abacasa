import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

import { Button } from './Button';
import { Text } from './Text';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface StateViewProps {
  /** loading: spinner; empty/error/forbidden: ikon + metin (+ isteğe bağlı aksiyon). */
  kind: 'loading' | 'empty' | 'error' | 'forbidden';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULTS: Record<Exclude<StateViewProps['kind'], 'loading'>, { icon: IconName; title: string }> = {
  empty: { icon: 'file-tray-outline', title: 'Henüz kayıt yok' },
  error: { icon: 'cloud-offline-outline', title: 'Bir şeyler ters gitti' },
  forbidden: { icon: 'lock-closed-outline', title: 'Bu sayfayı görme yetkin yok' },
};

/** Liste/detay ekranlarının yükleniyor, boş, hata ve yetkisiz durumları — tek görünüm. */
export function StateView({ kind, title, message, actionLabel, onAction }: StateViewProps) {
  if (kind === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }
  const d = DEFAULTS[kind];
  return (
    <View style={styles.container}>
      <Ionicons name={d.icon} size={40} color={Colors.textDisabled} />
      <Text variant="title" style={styles.center}>
        {title ?? d.title}
      </Text>
      {message ? (
        <Text muted style={styles.center}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button title={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  center: { textAlign: 'center' },
});

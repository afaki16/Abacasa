import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing, useColors } from '@/constants/theme';

import { EmptyState, ErrorState } from './EmptyState';
import type { IconName } from './Icon';

export interface StateViewProps {
  /** loading: spinner; empty/error/forbidden: ikon kutusu + metin (+ isteğe bağlı eylem). */
  kind: 'loading' | 'empty' | 'error' | 'forbidden';
  title?: string;
  message?: string;
  /** Yalnızca empty: varsayılan ikonun yerine. */
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Liste/detay ekranlarının yükleniyor, boş, hata ve yetkisiz durumları — tek görünüm.
 * EmptyState / ErrorState üzerine ince sarmalayıcı; liste ekranlarında yükleniyor için SkeletonList tercih et.
 */
export function StateView({ kind, title, message, icon, actionLabel, onAction }: StateViewProps) {
  const { t } = useTranslation();
  const colors = useColors();

  switch (kind) {
    case 'loading':
      return (
        <View style={styles.container}>
          <ActivityIndicator color={colors.primary} accessibilityLabel={t('common.loading')} />
        </View>
      );
    case 'error':
      return (
        <ErrorState
          title={title ?? t('common.error')}
          message={message}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      );
    case 'forbidden':
      return <EmptyState icon="lock" tone="neutral" title={title ?? t('ui.stateView.forbidden')} message={message} />;
    default:
      return (
        <EmptyState
          icon={icon ?? 'inbox'}
          title={title ?? t('ui.stateView.empty')}
          message={message}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      );
  }
}

// Renk içermeyen stiller temadan bağımsız.
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
});

import { View } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Tone = 'primary' | 'danger' | 'neutral';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  /** primary: boş liste · danger: hata · neutral: yetki yok. */
  tone?: Tone;
  /** Hata durumunda eylem çerçeveli (Yeniden dene); boşta dolu (Araç ekle). */
  actionVariant?: 'primary' | 'secondary';
}

/** Boş durum (Bilesenler · 7): ikon kutusu, başlık, açıklama, eylem düğmesi. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionIcon,
  onAction,
  tone = 'primary',
  actionVariant = 'primary',
}: EmptyStateProps) {
  const styles = useStyles();
  const colors = useColors();
  const tile =
    tone === 'danger'
      ? { bg: colors.dangerSurface, fg: colors.danger }
      : tone === 'neutral'
        ? { bg: colors.surface, fg: colors.textMuted }
        : { bg: colors.iconTile, fg: colors.iconTileText };

  return (
    <View style={styles.container}>
      <View style={[styles.tile, { backgroundColor: tile.bg }]}>
        <Icon name={icon} size={32} color={tile.fg} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message ? (
        <Text muted style={styles.message}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} icon={actionIcon} variant={actionVariant} size="sm" onPress={onAction} />
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Hata durumu (Bilesenler · 7): kırmızı ikon kutusu + "Yeniden dene". */
export function ErrorState({ title, message, actionLabel, onAction }: ErrorStateProps) {
  return (
    <EmptyState
      icon="error"
      tone="danger"
      title={title}
      message={message}
      actionLabel={actionLabel}
      actionIcon="refresh"
      actionVariant="secondary"
      onAction={onAction}
    />
  );
}

const useStyles = makeStyles(() => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  tile: { width: 64, height: 64, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.xs },
}));

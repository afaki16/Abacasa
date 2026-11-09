import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Badge, Icon, Text } from '@/components/ui';
import { FontFamily, makeStyles, Spacing, useColors } from '@/constants/theme';
import { formatDisplayDate } from '@/lib/format/period';
import { plural } from '@/lib/i18n';

import { relativeTime, type SessionRowModel } from '../sessionsView';
import { InlineTextButton } from './SettingsKit';

/** "2 saat önce" / "Az önce" / "21.10.2026". */
export function formatRelative(iso: string, now: number, t: TFunction): string {
  const r = relativeTime(iso, now);
  if (r.unit === 'justNow') return t('sessionsScreen.time.justNow');
  if (r.unit === 'date') return formatDisplayDate(r.iso);
  return plural(`sessionsScreen.time.${r.unit}`, r.count);
}

/** Satırın ikinci satırı: konum · durum. */
export function sessionMeta(session: SessionRowModel, now: number, t: TFunction): string {
  const parts: string[] = [];
  if (session.status === 'active') {
    if (session.place) parts.push(session.place);
    parts.push(
      session.isThisDevice
        ? t('sessionsScreen.activeNow')
        : t('sessionsScreen.signedIn', { time: formatRelative(session.createdDate, now, t) }),
    );
  } else if (session.status === 'expired') {
    parts.push(t('sessionsScreen.expiredOn', { date: formatDisplayDate(session.expiryDate) }));
    if (session.place) parts.push(session.place);
  } else {
    parts.push(t('sessionsScreen.revoked'));
    parts.push(t('sessionsScreen.signedInOn', { date: formatDisplayDate(session.createdDate) }));
  }
  return parts.join(' · ');
}

export interface SessionRowProps {
  session: SessionRowModel;
  now: number;
  first?: boolean;
  /** Aktif ve bu cihaz değilse "Kapat". */
  onRevoke?: () => void;
  busy?: boolean;
}

/** Oturum satırı: cihaz ikonu, ad (+ "Bu cihaz"), konum · zaman, "Kapat". Geçmiş satırı daha sade. */
export function SessionRow({ session, now, first, onRevoke, busy }: SessionRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const history = session.status !== 'active';
  const name = session.name ?? t('sessionsScreen.unknownDevice');
  const meta = sessionMeta(session, now, t);

  return (
    <View
      style={[styles.row, history && styles.historyRow, !first && styles.divider]}
      accessible={!onRevoke}
      accessibilityLabel={!onRevoke ? [name, session.isThisDevice ? t('sessionsScreen.thisDevice') : null, meta].filter(Boolean).join(', ') : undefined}
    >
      <Icon name={session.icon} size={history ? 22 : 24} color={history ? colors.placeholder : colors.textMuted} />
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={history ? styles.historyName : styles.name} numberOfLines={1}>
            {name}
          </Text>
          {session.isThisDevice ? <Badge label={t('sessionsScreen.thisDevice')} variant="paid" style={styles.badge} /> : null}
        </View>
        <Text variant="caption" muted numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {onRevoke ? (
        <InlineTextButton
          label={t('sessionsScreen.revoke')}
          accessibilityLabel={t('sessionsScreen.revokeFor', { device: name })}
          tone="danger"
          disabled={busy}
          onPress={onRevoke}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64, paddingLeft: 14, paddingRight: 6 },
  historyRow: { minHeight: 56, paddingRight: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  texts: { flex: 1, minWidth: 0, gap: 3, paddingVertical: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
  historyName: { flexShrink: 1, fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 19 },
  badge: { paddingHorizontal: 7, paddingVertical: 2 },
}));

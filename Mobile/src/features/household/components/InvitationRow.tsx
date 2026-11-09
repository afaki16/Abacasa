import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, MIN_TOUCH, Spacing, useColors } from '@/constants/theme';
import { InlineTextButton } from '@/features/account/components/SettingsKit';
import { enumLabel } from '@/lib/domain/enums';
import { plural } from '@/lib/i18n';

import { invitationDaysLeft, isInvitationExpired } from '../memberView';
import { canResendInvitation, canRevokeInvitation } from '../rules';
import type { HouseholdInvitation } from '../types';

export interface InvitationRowProps {
  invitation: HouseholdInvitation;
  first?: boolean;
  /** HouseholdMembers.Create varsa: yeniden gönder (yeni bağlantı, yeni 7 gün). */
  onResend?: () => void;
  /** HouseholdMembers.Delete varsa: bekleyen daveti iptal et. */
  onRevoke?: () => void;
  busy?: boolean;
}

/** Davet satırı: e-posta, "Üye · 5 gün geçerli" / "Süresi doldu", yeniden gönder ve "İptal et". */
export function InvitationRow({ invitation, first, onResend, onRevoke, busy }: InvitationRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const expired = isInvitationExpired(invitation);
  const role = enumLabel('householdRole', invitation.role);
  const validity = expired
    ? t('invitations.expired')
    : plural('invitations.daysLeft', Math.max(1, invitationDaysLeft(invitation.expiresAt)));
  const meta = [role, invitation.personName, validity].filter(Boolean).join(' · ');
  const resend = onResend && canResendInvitation(invitation) ? onResend : undefined;
  const revoke = onRevoke && canRevokeInvitation(invitation) && !expired ? onRevoke : undefined;

  return (
    <View style={[styles.row, !first && styles.divider]}>
      <Icon name={expired ? 'schedule' : 'schedule-send'} size={22} color={expired ? colors.textDisabled : colors.textMuted} />
      <View style={styles.texts}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {invitation.email}
        </Text>
        <Text variant="caption" color={expired ? colors.danger : colors.textMuted} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      {resend && expired ? (
        <InlineTextButton label={t('invitations.resend')} onPress={resend} disabled={busy} />
      ) : resend ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('invitations.resendFor', { email: invitation.email })}
          disabled={busy}
          onPress={resend}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Icon name="refresh" size={22} color={busy ? colors.textDisabled : colors.primary} />
        </Pressable>
      ) : null}
      {revoke ? (
        <InlineTextButton
          label={t('invitations.revoke')}
          accessibilityLabel={t('invitations.revokeFor', { email: invitation.email })}
          tone="danger"
          onPress={revoke}
          disabled={busy}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 64, paddingLeft: 14, paddingRight: 6 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
  texts: { flex: 1, minWidth: 0, gap: 2, paddingVertical: Spacing.sm },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { backgroundColor: c.surface },
}));

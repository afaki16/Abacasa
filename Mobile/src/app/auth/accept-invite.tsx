import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Badge, Button, EmptyState, ErrorState, FormError, Screen, Text } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { AuthHeader } from '@/features/auth/components/AuthParts';
import { InviteSummary } from '@/features/auth/components/InviteSummary';
import { useLogout } from '@/features/auth/hooks';
import { inviteDaysLeft, resolveInviteAction, resolveInviteView } from '@/features/auth/invite';
import { plural } from '@/lib/i18n';
import { useAcceptInvitation, useInvitationInfo } from '@/features/household/hooks';
import { toast } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';

/**
 * Davet kabulü. Web'deki /auth/accept-invite?token=… ile aynı yol: abacasa://auth/accept-invite?token=…
 * Oturum açık da kapalı da açılabilir (kök layout'ta ayrı guard).
 *  - Girişli, e-posta eşleşiyor → "Haneye katıl" (kabul + haneye geçiş)
 *  - Girişli, başka hesap → çıkış yapıp davetteki hesapla girmesi istenir
 *  - Girişsiz → "Kayıt ol ve katıl" (hesap yoksa) / "Giriş yap ve katıl"; token kayıt/giriş ekranına taşınır.
 */
export default function AcceptInviteScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const userEmail = useAuthStore((s) => (s.isAuthenticated ? (s.user?.email ?? null) : null));
  const query = useInvitationInfo(token);
  const accept = useAcceptInvitation();
  const logout = useLogout();
  const view = resolveInviteView(token, query);

  const leave = () => router.replace(userEmail ? '/' : '/login');
  const leaveLabel = userEmail ? t('invite.backToApp') : t('invite.backToLogin');

  if (view.kind === 'loading') {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text muted>{t('invite.loading')}</Text>
      </Screen>
    );
  }

  if (view.kind === 'error') {
    return (
      <Screen contentStyle={styles.center}>
        <ErrorState
          title={t('invite.loadErrorTitle')}
          message={t('invite.loadErrorText')}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
        <Button title={leaveLabel} variant="ghost" onPress={leave} />
      </Screen>
    );
  }

  if (view.kind === 'unavailable') {
    const copy = {
      notFound: { icon: 'link-off', title: t('invite.notFoundTitle'), message: t('invite.notFoundText') },
      Accepted: { icon: 'how-to-reg', title: t('invite.acceptedTitle'), message: t('invite.acceptedText') },
      Revoked: { icon: 'block', title: t('invite.revokedTitle'), message: t('invite.askAdmin') },
      Expired: { icon: 'event-busy', title: t('invite.expiredTitle'), message: t('invite.askAdmin') },
    } as const;
    const { icon, title, message } = copy[view.reason];
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState icon={icon} title={title} message={message} tone="neutral" actionLabel={leaveLabel} onAction={leave} />
      </Screen>
    );
  }

  const { info } = view;
  const action = resolveInviteAction(info, userEmail);
  const roleLabel = t(`enums.householdRole.${info.role}`);
  const daysLeft = inviteDaysLeft(info.expiresAt);
  const inviteParams = { inviteToken: token ?? '', email: info.email, household: info.householdName };

  const onAccept = () =>
    accept.mutate(token ?? '', {
      onSuccess: () => {
        toast.success(t('invite.joined', { household: info.householdName }));
        router.replace('/');
      },
    });

  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/app-icon.png')} style={styles.icon} contentFit="contain" />
        <AuthHeader center title={t('invite.title', { household: info.householdName })} subtitle={t('invite.subtitle')} />
      </View>

      <InviteSummary
        rows={[
          { label: t('invite.household'), value: info.householdName },
          { label: t('invite.inviter'), value: info.inviterName },
          {
            label: t('invite.role'),
            value: <Badge label={roleLabel} variant={info.role === 'Admin' ? 'admin' : 'member'} />,
            accessibilityValue: roleLabel,
          },
          { label: t('invite.email'), value: info.email },
          ...(daysLeft !== null
            ? [{ label: t('invite.validity'), value: plural('invite.daysLeft', daysLeft) }]
            : []),
        ]}
      />

      {action === 'otherAccount' ? (
        <Text muted style={styles.centerText}>
          {t('invite.otherAccount', { email: info.email })}
        </Text>
      ) : null}

      <FormError messages={accept.error?.messages} />

      <View style={styles.spacer} />

      <View style={styles.actions}>
        {action === 'accept' ? (
          <>
            <Button title={t('invite.accept')} loading={accept.isPending} onPress={onAccept} />
            <Button title={t('invite.backToApp')} variant="ghost" disabled={accept.isPending} onPress={leave} />
          </>
        ) : action === 'otherAccount' ? (
          <>
            <Button
              title={t('invite.switchAccount')}
              loading={logout.isPending}
              // Çıkıştan sonra bu ekran açık kalır (guard'sız): girişsiz eylemler görünür.
              onPress={() => logout.mutate()}
            />
            <Button title={t('invite.backToApp')} variant="ghost" onPress={leave} />
          </>
        ) : action === 'login' ? (
          <Button
            title={t('invite.loginAndJoin')}
            onPress={() => router.replace({ pathname: '/login', params: inviteParams })}
          />
        ) : (
          <>
            <Button
              title={t('invite.register')}
              onPress={() => router.replace({ pathname: '/register', params: inviteParams })}
            />
            <Button
              title={t('invite.haveAccount')}
              variant="secondary"
              onPress={() => router.replace({ pathname: '/login', params: inviteParams })}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(() => ({
  center: { justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  content: { paddingTop: 40, gap: Spacing.lg },
  hero: { gap: Spacing.lg, alignItems: 'stretch' },
  icon: { width: 72, height: 72, borderRadius: 18, alignSelf: 'center' },
  centerText: { textAlign: 'center' },
  spacer: { flexGrow: 1 },
  actions: { gap: Spacing.md },
}));

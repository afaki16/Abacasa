import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { Card, ListItem, OptionCards, Screen, Text } from '@/components/ui';
import { FontFamily, FontSize, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { useLogout } from '@/features/auth/hooks';
import { useHasPermission } from '@/features/auth/permissions';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { useAuthStore } from '@/stores/authStore';
import { SUPPORTED_LOCALES, usePreferencesStore, type ThemeMode } from '@/stores/preferencesStore';

const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toLocaleUpperCase('tr-TR') || '?';
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const canManageUsers = useHasPermission(USER_PERMISSIONS.READ);
  // Dil ve tema anında uygulanır: i18n ve useColors() tercih store'unu dinler.
  const locale = usePreferencesStore((s) => s.locale);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setLocale = usePreferencesStore((s) => s.setLocale);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const confirmLogout = () =>
    Alert.alert(t('common.logout'), t('profile.logoutMessage'), [
      { text: t('common.dismiss'), style: 'cancel' },
      { text: t('common.logout'), style: 'destructive', onPress: () => logout.mutate() },
    ]);

  return (
    <Screen scroll edges={['bottom']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text color={colors.onPrimary} style={styles.avatarText}>
            {initials(user?.firstName, user?.lastName)}
          </Text>
        </View>
        <View style={styles.headerTexts}>
          <Text variant="title" numberOfLines={1}>
            {user?.fullName}
          </Text>
          <Text muted numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </View>

      <Card title={t('profile.accountSection')} padded={false}>
        <ListItem icon="person-outline" title={t('profile.accountInfo')} onPress={() => router.push('/account')} />
        <ListItem
          icon="vpn-key"
          title={t('profile.changePassword')}
          onPress={() => router.push('/change-password')}
        />
        <ListItem
          icon="smartphone"
          title={t('profile.sessions')}
          subtitle={t('profile.sessionsSubtitle')}
          last
          onPress={() => router.push('/sessions')}
        />
      </Card>

      <Card title={t('profile.appearanceSection')}>
        <OptionCards
          label={t('profile.language')}
          options={SUPPORTED_LOCALES.map((value) => ({ value, label: t(`profile.languages.${value}`) }))}
          value={locale}
          onChange={(value) => void setLocale(value)}
        />
        <OptionCards
          label={t('profile.theme')}
          options={THEME_MODES.map((value) => ({
            value,
            label: t(`profile.themes.${value}`),
            description: value === 'system' ? t('profile.themeSystemDescription') : undefined,
          }))}
          value={themeMode}
          onChange={(value) => void setThemeMode(value)}
        />
      </Card>

      {canManageUsers && (
        <Card title={t('profile.adminSection')} padded={false}>
          <ListItem icon="people-outline" title={t('profile.users')} last onPress={() => router.push('/users')} />
        </Card>
      )}

      <Card padded={false}>
        <ListItem icon="logout" title={t('common.logout')} destructive last onPress={confirmLogout} />
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles((c) => ({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  headerTexts: { flex: 1, gap: 2 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.bold, fontSize: FontSize.title },
}));

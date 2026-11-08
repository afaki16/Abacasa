import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, ListItem, Text, type IconName } from '@/components/ui';
import { FontFamily, makeStyles, Spacing } from '@/constants/theme';
import { getPermissionNames } from '@/features/auth/permissions';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { EXCHANGE_RATE_PERMISSIONS } from '@/features/exchangeRates/constants';
import { HOUSEHOLD_PERMISSIONS } from '@/features/household/constants';
import { LEDGER_PERMISSIONS } from '@/features/ledger/constants';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { TabScreen } from '@/features/shell/TabScreen';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/stores/toastStore';

interface MenuItem {
  key: string;
  icon: IconName;
  /** Satırı görmek için gereken okuma izni; yoksa herkes görür. */
  permission?: string;
  /** Hazır ekran; yoksa "yakında" toast'ı. */
  href?: '/profile' | '/users';
}

interface MenuGroup {
  key: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    key: 'records',
    items: [
      { key: 'donations', icon: 'volunteer-activism', permission: DONATION_PERMISSIONS.READ },
      { key: 'debts', icon: 'account-balance-wallet', permission: DEBT_PERMISSIONS.READ },
      { key: 'ledger', icon: 'table-chart', permission: LEDGER_PERMISSIONS.READ },
      { key: 'vehicles', icon: 'directions-car', permission: VEHICLE_PERMISSIONS.READ },
    ],
  },
  {
    key: 'definitions',
    items: [
      { key: 'household', icon: 'group', permission: HOUSEHOLD_PERMISSIONS.READ },
      { key: 'categories', icon: 'category', permission: CATEGORY_PERMISSIONS.READ },
      { key: 'people', icon: 'person', permission: PERSON_PERMISSIONS.READ },
      { key: 'paymentMethods', icon: 'credit-card', permission: PAYMENT_METHOD_PERMISSIONS.READ },
      { key: 'exchangeRates', icon: 'currency-exchange', permission: EXCHANGE_RATE_PERMISSIONS.READ },
    ],
  },
  {
    key: 'account',
    items: [
      { key: 'profile', icon: 'account-circle', href: '/profile' },
      { key: 'users', icon: 'admin-panel-settings', permission: USER_PERMISSIONS.READ, href: '/users' },
    ],
  },
];

/** Diğer sekmesi: kayıtlar, hane ve tanımlar, hesap. İzni olmayan satır görünmez. */
export default function MoreScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  // Seçici yeni dizi döndürmesin (zustand sonsuz render); izin adları render'da çıkarılır.
  const user = useAuthStore((s) => s.user);
  const permissions = getPermissionNames(user);

  const open = (item: MenuItem) => (item.href ? router.push(item.href) : toast.info(t('ui.comingSoon')));

  return (
    <TabScreen>
      {GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.permission || permissions.includes(i.permission));
        if (items.length === 0) return null;
        return (
          <View key={group.key} style={styles.group}>
            <Text accessibilityRole="header" muted style={styles.groupTitle}>
              {t(`more.groups.${group.key}`)}
            </Text>
            <Card padded={false}>
              {items.map((item, index) => (
                <ListItem
                  key={item.key}
                  icon={item.icon}
                  title={t(`more.items.${item.key}`)}
                  last={index === items.length - 1}
                  onPress={() => open(item)}
                />
              ))}
            </Card>
          </View>
        );
      })}
    </TabScreen>
  );
}

const useStyles = makeStyles(() => ({
  group: { gap: 6 },
  groupTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingTop: Spacing.sm - 2,
    paddingHorizontal: Spacing.xs,
  },
}));

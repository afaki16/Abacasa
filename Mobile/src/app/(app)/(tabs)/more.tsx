import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, ListItem, type IconName } from '@/components/ui';
import { makeStyles } from '@/constants/theme';
import { getPermissionNames } from '@/features/auth/permissions';
import { SectionLabel } from '@/features/categories/components/DefinitionKit';
import { BUDGET_PERMISSIONS } from '@/features/budgets/constants';
import { budgetRoutes } from '@/features/budgets/routes';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { categoryRoutes } from '@/features/categories/routes';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { DONATION_FUND_PERMISSIONS } from '@/features/donationFunds/constants';
import { DONATION_TARGET_PERMISSIONS } from '@/features/donationTargets/constants';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { EXCHANGE_RATE_PERMISSIONS } from '@/features/exchangeRates/constants';
import { exchangeRateRoutes } from '@/features/exchangeRates/routes';
import { HOUSEHOLD_PERMISSIONS } from '@/features/household/constants';
import { LEDGER_PERMISSIONS } from '@/features/ledger/constants';
import { ledgerRoutes } from '@/features/ledger/routes';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import { paymentMethodRoutes } from '@/features/paymentMethods/routes';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { personRoutes } from '@/features/people/routes';
import { TabScreen } from '@/features/shell/TabScreen';
import { USER_PERMISSIONS } from '@/features/users/constants';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { vehicleRoutes } from '@/features/vehicles/routes';
import { useAuthStore } from '@/stores/authStore';

interface MenuItem {
  key: string;
  icon: IconName;
  href: Href;
  /** Satırı görmek için gereken okuma izni; yoksa herkes görür. */
  permission?: string;
  /** Yalnızca hanede bağış ekleri modülü açıksa (Bağış hedefleri, Emanetler). */
  donationExtras?: boolean;
}

interface MenuGroup {
  key: string;
  items: MenuItem[];
}

const GROUPS: MenuGroup[] = [
  {
    key: 'records',
    items: [
      {
        key: 'budgets',
        icon: 'savings',
        href: budgetRoutes.index,
        permission: BUDGET_PERMISSIONS.READ,
      },
      {
        key: 'donations',
        icon: 'volunteer-activism',
        href: '/donations' as Href,
        permission: DONATION_PERMISSIONS.READ,
      },
      {
        key: 'donationTargets',
        icon: 'flag',
        href: '/donation-targets' as Href,
        permission: DONATION_TARGET_PERMISSIONS.READ,
        donationExtras: true,
      },
      {
        key: 'donationFunds',
        icon: 'savings',
        href: '/donation-funds' as Href,
        permission: DONATION_FUND_PERMISSIONS.READ,
        donationExtras: true,
      },
      {
        key: 'debts',
        icon: 'account-balance-wallet',
        href: '/debts' as Href,
        permission: DEBT_PERMISSIONS.READ,
      },
      {
        key: 'ledger',
        icon: 'table-chart',
        href: ledgerRoutes.index,
        permission: LEDGER_PERMISSIONS.READ,
      },
      {
        key: 'vehicles',
        icon: 'directions-car',
        href: vehicleRoutes.index,
        permission: VEHICLE_PERMISSIONS.READ,
      },
    ],
  },
  {
    key: 'definitions',
    items: [
      {
        key: 'household',
        icon: 'group',
        href: '/household' as Href,
        permission: HOUSEHOLD_PERMISSIONS.READ,
      },
      {
        key: 'categories',
        icon: 'category',
        href: categoryRoutes.index,
        permission: CATEGORY_PERMISSIONS.READ,
      },
      {
        key: 'people',
        icon: 'person',
        href: personRoutes.index,
        permission: PERSON_PERMISSIONS.READ,
      },
      {
        key: 'paymentMethods',
        icon: 'credit-card',
        href: paymentMethodRoutes.index,
        permission: PAYMENT_METHOD_PERMISSIONS.READ,
      },
      {
        key: 'exchangeRates',
        icon: 'currency-exchange',
        href: exchangeRateRoutes.index,
        permission: EXCHANGE_RATE_PERMISSIONS.READ,
      },
    ],
  },
  {
    key: 'account',
    items: [
      { key: 'profile', icon: 'account-circle', href: '/profile' },
      { key: 'settings', icon: 'settings', href: '/settings' as Href },
      {
        key: 'users',
        icon: 'admin-panel-settings',
        href: '/users',
        permission: USER_PERMISSIONS.READ,
      },
    ],
  },
];

/**
 * Diğer sekmesi: kayıtlar, hane ve tanımlar, hesap. Okuma izni olmayan satır görünmez; Bağış hedefleri ve
 * Emanetler yalnızca hanede bağış ekleri modülü açıksa listelenir.
 */
export default function MoreScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  // Seçici yeni dizi döndürmesin (zustand sonsuz render); izin adları render'da çıkarılır.
  const user = useAuthStore((s) => s.user);
  const permissions = getPermissionNames(user);
  const donationExtras = !!user?.activeTenant?.modules?.donationExtras;

  const visible = (item: MenuItem) =>
    (!item.permission || permissions.includes(item.permission)) &&
    (!item.donationExtras || donationExtras);

  return (
    <TabScreen>
      {GROUPS.map((group) => {
        const items = group.items.filter(visible);
        if (items.length === 0) return null;
        return (
          <View key={group.key} style={styles.group}>
            <SectionLabel>{t(`moreMenu.groups.${group.key}`)}</SectionLabel>
            <Card padded={false}>
              {items.map((item, index) => (
                <ListItem
                  key={item.key}
                  icon={item.icon}
                  title={t(`moreMenu.items.${item.key}`)}
                  last={index === items.length - 1}
                  onPress={() => router.push(item.href)}
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
}));

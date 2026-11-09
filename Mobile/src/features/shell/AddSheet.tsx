import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { BottomSheet, Icon, Text, type IconName } from '@/components/ui';
import { makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { hasPermission } from '@/features/auth/permissions';
import { DEBT_PERMISSIONS } from '@/features/debts/constants';
import { DONATION_PERMISSIONS } from '@/features/donations/constants';
import { EXPENSE_PERMISSIONS } from '@/features/expenses/constants';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import { VEHICLE_PERMISSIONS } from '@/features/vehicles/constants';
import { useAuthStore } from '@/stores/authStore';

import type { User } from '@/features/auth/types';

interface AddItem {
  key: 'expense' | 'donation' | 'debt' | 'recurringPayment' | 'vehicleOperation';
  icon: IconName;
  /** Açılacak ekran. Araç işlemi önce araç seçtirir (işlem bir araca bağlıdır); vade ödemesi Dönem listesinden yapılır. */
  href: Href;
  /** Kullanıcı bu kaydı ekleyebiliyor mu (yalnızca arayüz; asıl kontrol backend'de). */
  allowed: (user: User | null) => boolean;
}

const ITEMS: AddItem[] = [
  { key: 'expense', icon: 'shopping-cart', href: '/expenses/new' as Href, allowed: (u) => hasPermission(u, EXPENSE_PERMISSIONS.CREATE) },
  { key: 'donation', icon: 'volunteer-activism', href: '/donations/new' as Href, allowed: (u) => hasPermission(u, DONATION_PERMISSIONS.CREATE) },
  { key: 'debt', icon: 'account-balance-wallet', href: '/debts/new' as Href, allowed: (u) => hasPermission(u, DEBT_PERMISSIONS.CREATE) },
  {
    // Sabit ödeme ödemesi bağlı bir harcama ya da bağış kaydı oluşturur.
    key: 'recurringPayment',
    icon: 'event-available',
    href: '/recurring' as Href,
    allowed: (u) =>
      hasPermission(u, RECURRING_PAYMENT_PERMISSIONS.READ) &&
      (hasPermission(u, EXPENSE_PERMISSIONS.CREATE) || hasPermission(u, DONATION_PERMISSIONS.CREATE)),
  },
  // Araç işlemi ekleme Vehicles.Update ister.
  { key: 'vehicleOperation', icon: 'directions-car', href: '/vehicles' as Href, allowed: (u) => hasPermission(u, VEHICLE_PERMISSIONS.UPDATE) },
];

export interface AddSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Sekme çubuğundaki "Ekle" düğmesinin alttan sayfası ("Ne eklemek istersin?"). Yalnızca yetkili
 * olunan kayıt türleri listelenir; ilk (Harcama) vurgulu.
 */
export function AddSheet({ visible, onClose }: AddSheetProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const user = useAuthStore((s) => s.user);
  const items = ITEMS.filter((i) => i.allowed(user));

  const choose = (item: AddItem) => {
    onClose();
    router.push(item.href);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('add.title')}>
      {items.length === 0 ? (
        <Text muted style={styles.empty}>
          {t('add.noPermission')}
        </Text>
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => {
            const featured = index === 0 && item.key === 'expense';
            const label = t(`add.items.${item.key}`);
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={featured ? `${label}, ${t('add.mostUsed')}` : label}
                onPress={() => choose(item)}
                style={({ pressed }) => [styles.row, featured && styles.featured, pressed && styles.pressed]}
              >
                <View style={[styles.tile, featured && styles.tileFeatured]}>
                  <Icon name={item.icon} size={24} color={featured ? colors.onPrimary : colors.text} />
                </View>
                <View style={styles.texts}>
                  <Text variant="bodyStrong" style={styles.label}>
                    {label}
                  </Text>
                  {featured ? (
                    <Text variant="caption" muted>
                      {t('add.mostUsed')}
                    </Text>
                  ) : null}
                </View>
                <Icon name="chevron-right" size={22} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}

const useStyles = makeStyles((c) => ({
  list: { gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.button,
  },
  featured: { minHeight: 64, backgroundColor: c.iconTile },
  pressed: { backgroundColor: c.surface },
  tile: {
    width: 44,
    height: 44,
    borderRadius: Radius.button,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFeatured: { backgroundColor: c.primary },
  texts: { flex: 1, gap: 2 },
  label: { fontSize: 16, lineHeight: 22 },
  empty: { paddingVertical: Spacing.lg, textAlign: 'center' },
}));

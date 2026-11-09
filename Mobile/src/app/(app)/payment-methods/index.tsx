import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import { Card, EmptyState, ErrorState, Icon, SkeletonList } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import {
  DefinitionRow,
  HeaderTextAction,
  SectionLabel,
} from '@/features/categories/components/DefinitionKit';
import { PAYMENT_METHOD_PERMISSIONS } from '@/features/paymentMethods/constants';
import {
  PAYMENT_METHOD_ICONS,
  paymentMethodMeta,
  splitByActive,
} from '@/features/paymentMethods/display';
import { usePaymentMethodOptions } from '@/features/paymentMethods/hooks';
import { paymentMethodRoutes } from '@/features/paymentMethods/routes';
import type { PaymentMethod } from '@/features/paymentMethods/types';

/**
 * Ödeme araçları: aktif ve pasif bölümleri. Liste seçicilerle aynı tek istekte gelir (hane başına az kayıt;
 * pasifler ayrı bölümde gösterildiği için sayfalama yerine tamamı). Kullanımdaki araç silinemez, pasif yapılır.
 */
export default function PaymentMethodsScreen() {
  return (
    <RequirePermission permission={PAYMENT_METHOD_PERMISSIONS.READ}>
      <PaymentMethods />
    </RequirePermission>
  );
}

function PaymentMethods() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canCreate = useHasPermission(PAYMENT_METHOD_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(PAYMENT_METHOD_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(PAYMENT_METHOD_PERMISSIONS.DELETE);
  const canOpen = canUpdate || canDelete;
  const query = usePaymentMethodOptions();
  const add = () => router.push(paymentMethodRoutes.new);
  const { active, inactive } = splitByActive(query.data ?? []);
  const labels = {
    shared: t('paymentMethods.shared'),
    statementDay: (day: number) => t('paymentMethods.statementDayShort', { day }),
    mealCardNote: t('paymentMethods.mealCardNote'),
  };

  const row = (m: PaymentMethod, index: number) => (
    <DefinitionRow
      key={m.id}
      divider={index > 0}
      leading={
        <Icon
          name={m.isActive ? PAYMENT_METHOD_ICONS[m.type] : 'credit-card-off'}
          size={22}
          color={m.isActive ? colors.primary : colors.placeholder}
        />
      }
      title={m.name}
      subtitle={m.isActive ? paymentMethodMeta(m, labels) : t('paymentMethods.inactiveNote')}
      muted={!m.isActive}
      onPress={canOpen ? () => router.push(paymentMethodRoutes.edit(m.id)) : undefined}
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('paymentMethods.title'),
          headerRight: canCreate
            ? () => <HeaderTextAction label={t('common.add')} onPress={add} />
            : undefined,
        }}
      />
      {query.isPending ? (
        <View style={styles.content}>
          <SkeletonList rows={5} />
        </View>
      ) : query.isError ? (
        <ErrorState
          title={t('common.error')}
          message={query.error.message}
          actionLabel={t('common.retry')}
          onAction={() => void query.refetch()}
        />
      ) : active.length + inactive.length === 0 ? (
        <EmptyState
          icon="credit-card"
          title={t('paymentMethods.emptyTitle')}
          message={t('paymentMethods.emptyMessage')}
          actionLabel={canCreate ? t('paymentMethods.add') : undefined}
          actionIcon="add"
          onAction={canCreate ? add : undefined}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.background}
              onRefresh={() => void query.refetch()}
            />
          }
        >
          {active.length > 0 ? (
            <View style={styles.group}>
              <SectionLabel>{t('paymentMethods.activeSection')}</SectionLabel>
              <Card padded={false}>{active.map(row)}</Card>
            </View>
          ) : null}
          {inactive.length > 0 ? (
            <View style={styles.group}>
              <SectionLabel>{t('paymentMethods.inactiveSection')}</SectionLabel>
              <Card padded={false}>{inactive.map(row)}</Card>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  group: { gap: 6 },
}));

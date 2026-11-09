import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SegmentedControl } from '@/components/ui';
import { makeStyles, Spacing } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { PeriodView } from '@/features/recurringPayments/components/PeriodView';
import { PlansView } from '@/features/recurringPayments/components/PlansView';
import { RECURRING_PAYMENT_PERMISSIONS } from '@/features/recurringPayments/constants';
import { TabScreen } from '@/features/shell/TabScreen';

type Segment = 'period' | 'plans';

/** Sabit ödemeler sekmesi: Dönem (vadeler, öde / geri al) ve Planlar. */
export default function RecurringPaymentsScreen() {
  return (
    <TabScreen scroll={false}>
      <RequirePermission permission={RECURRING_PAYMENT_PERMISSIONS.READ}>
        <RecurringContent />
      </RequirePermission>
    </TabScreen>
  );
}

function RecurringContent() {
  const { t } = useTranslation();
  const styles = useStyles();
  const [segment, setSegment] = useState<Segment>('period');

  return (
    <View style={styles.fill}>
      <View style={styles.segment}>
        <SegmentedControl<Segment>
          accessibilityLabel={t('tabs.recurring')}
          segments={[
            { value: 'period', label: t('recurring.segments.period') },
            { value: 'plans', label: t('recurring.segments.plans') },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>
      {segment === 'period' ? <PeriodView /> : <PlansView />}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  fill: { flex: 1 },
  segment: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.sm },
}));

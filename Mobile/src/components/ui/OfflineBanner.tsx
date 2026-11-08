import { useNetworkState } from 'expo-network';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { FontFamily, makeStyles, MIN_TOUCH, Radius, Spacing, useColors } from '@/constants/theme';

import { Icon } from './Icon';
import { Text } from './Text';

export interface OfflineBannerProps {
  /** "Tekrar dene": genelde ekrandaki sorguları yeniden çeker. Verilmezse eylem gösterilmez. */
  onRetry?: () => void;
}

/**
 * İnternet yok bandı (Bilesenler · 7). Bağlantı varken hiçbir şey çizmez.
 * Bağlantı durumu bilinmiyorsa (undefined) da gizli kalır — yanlış alarm vermesin.
 */
export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  if (!offline) return null;
  return <OfflineBannerView onRetry={onRetry} />;
}

/** Bandın görünümü (bağlantı durumundan bağımsız). */
export function OfflineBannerView({ onRetry }: OfflineBannerProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.band}>
      <Icon name="wifi-off" size={20} color={colors.onInverse} />
      <Text color={colors.onInverse} style={styles.text}>
        {t('ui.offline.message')}
      </Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.retry')} onPress={onRetry} style={styles.action}>
          <Text color={colors.inverseAction} style={styles.actionText}>
            {t('common.retry')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: c.inverseSurface,
  },
  text: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14, paddingVertical: 10 },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  actionText: { fontFamily: FontFamily.semibold, fontSize: 14 },
}));

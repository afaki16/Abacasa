import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { makeStyles, Spacing, useColorSchemeName } from '@/constants/theme';

const WORDMARK_RATIO = 773 / 527;

export interface AuthLogoProps {
  /** Logonun genişliği (açık tema, kelime markası). Koyu temada ikon boyu buna göre ölçeklenir. */
  width?: number;
}

/**
 * Giriş ekranlarının logosu. Açık temada şeffaf kelime markası (logo-wordmark); markadaki koyu lacivert
 * "aba" koyu zeminde okunmadığı için koyu temada uygulama ikonu + "Abacasa" yazısı.
 */
export function AuthLogo({ width = 112 }: AuthLogoProps) {
  const { t } = useTranslation();
  const scheme = useColorSchemeName();
  const styles = useStyles();
  const brand = t('authScreens.brand');

  if (scheme === 'dark') {
    const icon = Math.round(width * 0.5);
    return (
      <View style={styles.dark} accessible accessibilityRole="image" accessibilityLabel={brand}>
        <Image
          source={require('@/assets/images/app-icon.png')}
          style={{ width: icon, height: icon, borderRadius: icon * 0.24 }}
          contentFit="contain"
        />
        <Text variant="h2">{brand}</Text>
      </View>
    );
  }

  return (
    <Image
      source={require('@/assets/images/logo-wordmark.png')}
      style={[styles.wordmark, { width, height: width / WORDMARK_RATIO }]}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={brand}
    />
  );
}

const useStyles = makeStyles(() => ({
  wordmark: { alignSelf: 'center' },
  dark: { alignSelf: 'center', alignItems: 'center', gap: Spacing.sm },
}));

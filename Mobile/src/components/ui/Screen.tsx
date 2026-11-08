import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { makeStyles, Spacing } from '@/constants/theme';

export interface ScreenProps {
  children: ReactNode;
  /** Formlu ekranlar: klavye açılınca odaklı alan görünür kalır. */
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Ekran kabı: safe area + arka plan + (isteğe bağlı) klavyeye duyarlı kaydırma.
 * RN'nin KeyboardAvoidingView'i Android edge-to-edge'de klavye kapanınca boşluk
 * bırakabiliyor — react-native-keyboard-controller kullanılır.
 */
export function Screen({ children, scroll, edges = ['top', 'bottom'], contentStyle }: ScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {scroll ? (
        <KeyboardAwareScrollView
          bottomOffset={Spacing.xl}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, contentStyle]}
        >
          {children}
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles((c) => ({
  safeArea: { flex: 1, backgroundColor: c.background },
  fill: { flex: 1 },
  content: { flexGrow: 1, padding: Spacing.xl, gap: Spacing.lg },
}));

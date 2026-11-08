import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { FontFamily, makeStyles, Radius, Spacing } from '@/constants/theme';

import { Button } from './Button';
import { Text } from './Text';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Onay düğmesi metni (Sil, Çıkış yap). */
  confirmLabel: string;
  /** Verilmezse "Vazgeç". */
  cancelLabel?: string;
  /** Yıkıcı işlem: onay düğmesi kırmızı. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Onay penceresi (Bilesenler · 7): silme, çıkış gibi geri alınamayan işlemler.
 * Karartmaya dokunma ve geri tuşu "Vazgeç" sayılır (işlem sürerken kapanmaz).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const cancel = () => {
    if (!loading) onCancel();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel ?? t('common.dismiss')}
          onPress={cancel}
        />
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {message ? <Text muted>{message}</Text> : null}
          <View style={styles.actions}>
            <Button
              title={cancelLabel ?? t('common.dismiss')}
              variant="secondary"
              size="sm"
              disabled={loading}
              onPress={cancel}
              style={styles.action}
            />
            <Button
              title={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              size="sm"
              loading={loading}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: { flex: 1, backgroundColor: c.scrim, justifyContent: 'center', padding: Spacing.xl },
  dialog: {
    backgroundColor: c.card,
    borderRadius: Radius.xl,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  action: { flex: 1, paddingHorizontal: Spacing.sm },
}));

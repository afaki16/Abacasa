import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Button, FormError, Icon, Text, TextField } from '@/components/ui';
import { FontFamily, makeStyles, Radius, Spacing, useColors } from '@/constants/theme';
import { mapFieldErrors } from '@/features/account/serverErrors';
import { plural } from '@/lib/i18n';

import { useDeleteHousehold } from '../hooks';

export interface DeleteHouseholdDialogProps {
  visible: boolean;
  householdName: string;
  memberCount: number;
  onCancel: () => void;
  /** Silindikten sonra (önbellek sıfırlandı, sunucu yeni aktif haneyi seçti). */
  onDeleted: () => void;
}

/** Hane adının birebir yazılması (baştaki/sondaki boşluk yok sayılır). */
export const isHouseholdNameConfirmed = (typed: string, name: string) => typed.trim() === name.trim();

/**
 * Haneyi sil · ikinci onay: hane adını yaz + şifre. Tüm kayıtlar, üyelikler ve davetler kalıcı olarak silinir.
 * Düğme ad eşleşip şifre girilene kadar pasif.
 */
export function DeleteHouseholdDialog({ visible, householdName, memberCount, onCancel, onDeleted }: DeleteHouseholdDialogProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const remove = useDeleteHousehold();
  const [confirmName, setConfirmName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string>();
  const [nameError, setNameError] = useState<string>();
  const [formErrors, setFormErrors] = useState<string[]>();
  const ready = isHouseholdNameConfirmed(confirmName, householdName) && password.length > 0;

  const reset = () => {
    setConfirmName('');
    setPassword('');
    setPasswordError(undefined);
    setNameError(undefined);
    setFormErrors(undefined);
    remove.reset();
  };

  const cancel = () => {
    if (remove.isPending) return;
    reset();
    onCancel();
  };

  const submit = () => {
    if (!ready) return;
    setFormErrors(undefined);
    remove.mutate(
      { confirmName: confirmName.trim(), password },
      {
        onSuccess: () => {
          reset();
          onDeleted();
        },
        onError: (error) => {
          const { fields, rest } = mapFieldErrors(error.fieldErrors, {
            Password: 'password' as const,
            ConfirmName: 'confirmName' as const,
          });
          setPasswordError(fields.find((f) => f.name === 'password')?.message);
          setNameError(fields.find((f) => f.name === 'confirmName')?.message);
          setFormErrors(fields.length > 0 ? (rest.length > 0 ? rest : undefined) : error.messages);
        },
      },
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={cancel}>
      <KeyboardAvoidingView behavior="padding" style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismiss')}
          onPress={cancel}
        />
        <View accessibilityViewIsModal accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.iconTile}>
            <Icon name="delete-forever" size={24} color={colors.danger} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {t('householdScreen.delete.title', { name: householdName })}
          </Text>
          <Text muted>{plural('householdScreen.delete.message', memberCount)}</Text>
          <FormError messages={formErrors} />
          <TextField
            label={t('householdScreen.delete.nameLabel')}
            placeholder={householdName}
            value={confirmName}
            onChangeText={setConfirmName}
            error={nameError}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextField
            label={t('householdScreen.delete.passwordLabel')}
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={submit}
          />
          <View style={styles.actions}>
            <Button
              title={t('common.dismiss')}
              variant="secondary"
              size="sm"
              disabled={remove.isPending}
              onPress={cancel}
              style={styles.action}
            />
            <Button
              title={t('householdScreen.delete.confirm')}
              variant="destructive"
              size="sm"
              disabled={!ready}
              loading={remove.isPending}
              onPress={submit}
              style={styles.action}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: { flex: 1, backgroundColor: c.scrim, justifyContent: 'center', padding: 20 },
  dialog: {
    backgroundColor: c.card,
    borderRadius: Radius.xl,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 10, marginTop: Spacing.xs },
  action: { flex: 1, paddingHorizontal: Spacing.sm },
}));

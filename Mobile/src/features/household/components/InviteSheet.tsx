import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, FormError, OptionCards, Text, TextField } from '@/components/ui';
import { mapFieldErrors } from '@/features/account/serverErrors';
import { emailSchema } from '@/features/auth/validation';
import type { HouseholdRole } from '@/lib/domain/enums';
import { toast } from '@/stores/toastStore';

import { useCreateHouseholdInvitation } from '../hooks';

export interface InviteSheetProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Davet gönder (alttan sayfa): e-posta + rol (Üye / Yönetici). Davet 7 gün geçerli ve tek kullanımlık;
 * zaten üye ya da bekleyen davet varsa sunucu 409 döner (mesaj formun üstünde).
 */
export function InviteSheet({ visible, onClose }: InviteSheetProps) {
  const { t } = useTranslation();
  const create = useCreateHouseholdInvitation();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<HouseholdRole>('Member');
  const [emailError, setEmailError] = useState<string>();
  const [formErrors, setFormErrors] = useState<string[]>();

  const close = () => {
    onClose();
    setEmail('');
    setRole('Member');
    setEmailError(undefined);
    setFormErrors(undefined);
    create.reset();
  };

  const submit = () => {
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) return setEmailError(parsed.error.issues[0]?.message ?? 'validation.email.invalid');
    setEmailError(undefined);
    setFormErrors(undefined);
    create.mutate(
      { email: parsed.data.toLowerCase(), role, personId: null },
      {
        onSuccess: (result) => {
          toast.success(
            result.emailSent
              ? t('invitations.sent', { email: result.email })
              : t('invitations.sentWithoutEmail', { email: result.email }),
          );
          close();
        },
        onError: (error) => {
          const { fields, rest } = mapFieldErrors(error.fieldErrors, { Email: 'email' as const });
          const fieldError = fields.find((f) => f.name === 'email');
          if (fieldError) setEmailError(fieldError.message);
          setFormErrors(fieldError ? (rest.length > 0 ? rest : undefined) : error.messages);
        },
      },
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t('invitations.sheetTitle')}
      actionLabel={t('invitations.submit')}
      onAction={submit}
      actionLoading={create.isPending}
    >
      <FormError messages={formErrors} />
      <TextField
        label={t('common.email')}
        value={email}
        onChangeText={setEmail}
        error={emailError}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        maxLength={100}
        returnKeyType="done"
      />
      <OptionCards
        label={t('invitations.role')}
        options={[
          { value: 'Member', label: t('enums.householdRole.Member'), description: t('invitations.memberDescription') },
          { value: 'Admin', label: t('enums.householdRole.Admin'), description: t('invitations.adminDescription') },
        ]}
        value={role}
        onChange={setRole}
      />
      <Text variant="label" muted>
        {t('invitations.validity')}
      </Text>
    </BottomSheet>
  );
}

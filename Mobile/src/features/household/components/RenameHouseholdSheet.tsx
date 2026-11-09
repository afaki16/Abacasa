import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet, FormError, TextField } from '@/components/ui';
import { toast } from '@/stores/toastStore';

import { useUpdateHousehold } from '../hooks';

const NAME_MAX = 100;

export interface RenameHouseholdSheetProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
}

/** Hane adını değiştir (Household.Update). Ad /me'de de güncellenir (üst bar, hane seçici). */
export function RenameHouseholdSheet({ visible, currentName, onClose }: RenameHouseholdSheetProps) {
  const { t } = useTranslation();
  const update = useUpdateHousehold();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string>();
  // Sayfa her açılışta güncel adla başlasın.
  const [openedWith, setOpenedWith] = useState<string | null>(null);
  if (visible && openedWith === null) {
    setOpenedWith(currentName);
    setName(currentName);
  } else if (!visible && openedWith !== null) {
    setOpenedWith(null);
  }

  const close = () => {
    onClose();
    setError(undefined);
    update.reset();
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError('validation.householdName.required');
    if (trimmed.length > NAME_MAX) return setError('validation.householdName.max');
    setError(undefined);
    if (trimmed === currentName) return close();
    update.mutate(
      { name: trimmed },
      {
        onSuccess: (household) => {
          toast.success(t('householdScreen.rename.saved', { name: household.name }));
          close();
        },
      },
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={t('householdScreen.rename.title')}
      actionLabel={t('common.save')}
      onAction={submit}
      actionLoading={update.isPending}
    >
      <FormError messages={update.error?.messages} />
      <TextField
        label={t('householdScreen.rename.label')}
        value={name}
        onChangeText={setName}
        error={error}
        maxLength={NAME_MAX}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={submit}
      />
    </BottomSheet>
  );
}

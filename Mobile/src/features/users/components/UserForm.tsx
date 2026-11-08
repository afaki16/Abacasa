import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { Button, Card, FormError, FormField, next, OptionCards, StateView, SwitchCard, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { UserStatus } from '@/features/auth/types';
import {
  emailSchema,
  nameSchema,
  PASSWORD_HINT_KEY,
  passwordSchema,
  phoneSchema,
  toNullable,
} from '@/features/auth/validation';
import type { ApiError } from '@/lib/api';

import { SELECTABLE_USER_STATUSES } from '../constants';
import { useRoleOptions } from '../hooks';
import type { UserDetail } from '../types';

const schema = z
  .object({
    firstName: nameSchema('firstName'),
    lastName: nameSchema('lastName'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    password: z.string(),
    sendInvitation: z.boolean(),
    status: z.enum(['Active', 'Inactive', 'Banned', 'PendingVerification']),
    mustChangePassword: z.boolean(),
    roleIds: z.array(z.number()).min(1, 'validation.rolesRequired'),
    /** Yalnızca oluşturmada şifre istenir (davet gönderilmiyorsa). */
    isCreate: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.isCreate || v.sendInvitation) return;
    const result = passwordSchema.safeParse(v.password);
    if (!result.success) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: result.error.issues[0].message });
    }
  });

export type UserFormValues = z.infer<typeof schema>;

export interface UserFormSubmit {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  password: string | null;
  sendInvitation: boolean;
  status: UserStatus;
  mustChangePassword: boolean;
  roleIds: number[];
}

export interface UserFormProps {
  /** Düzenlemede mevcut kayıt; yoksa oluşturma modu. */
  user?: UserDetail;
  /** Kullanıcı kendi kaydını düzenliyorsa durum ve "şifre değiştirsin" kilitlenir (backend de reddeder). */
  isSelf?: boolean;
  pending: boolean;
  error: ApiError | null;
  submitLabel: string;
  onSubmit: (values: UserFormSubmit) => void;
}

/** Kullanıcı oluşturma/düzenleme formu (ekranlar arasında ortak). */
export function UserForm({ user, isSelf, pending, error, submitLabel, onSubmit }: UserFormProps) {
  const { t } = useTranslation();
  const isCreate = !user;
  const roles = useRoleOptions();

  const { control, handleSubmit, setFocus } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      password: '',
      sendInvitation: false,
      status: user?.status ?? 'Active',
      mustChangePassword: user?.mustChangePassword ?? false,
      roleIds: user?.roles.map((r) => r.id) ?? [],
      isCreate,
    },
  });

  // watch() yerine useWatch: React Compiler ile uyumlu (watch memo'lanamaz).
  const sendInvitation = useWatch({ control, name: 'sendInvitation' });

  const statusOptions = SELECTABLE_USER_STATUSES.map((value) => ({
    value,
    label: t(`users.status.${value}`),
    description: t(`users.statusDescription.${value}`),
  }));

  const submit = () =>
    handleSubmit((v) =>
      onSubmit({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        email: v.email.trim().toLowerCase(),
        phoneNumber: toNullable(v.phoneNumber),
        password: isCreate && !v.sendInvitation ? v.password : null,
        sendInvitation: v.sendInvitation,
        status: v.status,
        mustChangePassword: v.mustChangePassword,
        roleIds: v.roleIds,
      }),
    )();

  return (
    <View style={styles.container}>
      <FormError messages={error?.messages} />

      <Card title={t('common.personalInfo')}>
        <FormField control={control} name="firstName" label={t('common.firstName')} {...next(() => setFocus('lastName'))} />
        <FormField control={control} name="lastName" label={t('common.lastName')} {...next(() => setFocus('email'))} />
      </Card>

      <Card title={t('common.contact')}>
        <FormField
          control={control}
          name="email"
          label={t('common.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          {...next(() => setFocus('phoneNumber'))}
        />
        <FormField control={control} name="phoneNumber" label={t('common.phoneOptional')} keyboardType="phone-pad" />
      </Card>

      {isCreate && (
        <Card title={t('users.form.loginSection')}>
          <Controller
            control={control}
            name="sendInvitation"
            render={({ field }) => (
              <SwitchCard
                title={t('users.form.sendInvitation')}
                description={t('users.form.sendInvitationDescription')}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {!sendInvitation && (
            <FormField
              control={control}
              name="password"
              label={t('users.form.tempPassword')}
              hint={t(PASSWORD_HINT_KEY)}
              secureTextEntry
              autoComplete="new-password"
            />
          )}
        </Card>
      )}

      <Card title={t('users.form.statusSection')}>
        <Controller
          control={control}
          name="status"
          render={({ field, fieldState }) => (
            <OptionCards
              options={statusOptions}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              disabled={isSelf}
            />
          )}
        />
        {!isSelf && (
          <Controller
            control={control}
            name="mustChangePassword"
            render={({ field }) => (
              <SwitchCard
                title={t('users.form.mustChangePassword')}
                description={t('users.form.mustChangePasswordDescription')}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
        {isSelf && (
          <Text variant="caption" muted>
            {t('users.form.selfStatusNote')}
          </Text>
        )}
      </Card>

      <Card title={t('users.form.rolesSection')}>
        {roles.isPending ? (
          <StateView kind="loading" />
        ) : roles.isError ? (
          <FormError messages={[t('users.form.rolesLoadError')]} />
        ) : (
          <Controller
            control={control}
            name="roleIds"
            render={({ field, fieldState }) => (
              <OptionCards
                multiple
                options={(roles.data ?? []).map((r) => ({
                  value: r.id,
                  label: r.name,
                  description: r.description ?? undefined,
                }))}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
        )}
      </Card>

      <Button title={submitLabel} loading={pending} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
});

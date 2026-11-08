import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { TextField, type TextFieldProps } from './TextField';

export interface FormFieldProps<T extends FieldValues>
  extends Omit<TextFieldProps, 'value' | 'onChangeText' | 'error' | 'ref'> {
  control: Control<T>;
  name: FieldPath<T>;
}

/**
 * Klavyedeki "ileri" tuşuyla sonraki alana geçiş:
 *   <FormField name="email" {...next(() => setFocus('password'))} />
 * Son alanda bunun yerine returnKeyType="go" + onSubmitEditing={submit} kullan.
 */
export function next(focusNext: () => void) {
  // submitBehavior 'submit': odak sonraki alana geçerken klavye kapanıp açılmaz.
  return { returnKeyType: 'next' as const, submitBehavior: 'submit' as const, onSubmitEditing: focusNext };
}

/** react-hook-form'a bağlı TextField: değer, değişiklik, blur ve hata mesajı otomatik. */
export function FormField<T extends FieldValues>({ control, name, onBlur, ...rest }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...rest}
          ref={field.ref}
          value={(field.value as string | undefined) ?? ''}
          onChangeText={field.onChange}
          onBlur={(e) => {
            field.onBlur();
            onBlur?.(e);
          }}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

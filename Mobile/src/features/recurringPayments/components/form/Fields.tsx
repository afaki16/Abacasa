// Seçim ve tarih alanları: PickerField + ilgili alttan sayfa (SelectSheet / DatePickerSheet) tek parçada.
// Sunucu hatalarını form alanlarına bağlayan hook da burada (planlama formlarında ortak).

import { useEffect, useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { DatePickerSheet, SelectSheet, type SelectOption } from '@/components/ui';
import type { ApiError } from '@/lib/api';
import { formatDisplayDate } from '@/lib/format/period';

import { splitFieldErrors } from '../../formErrors';
import { PickerField } from './PickerField';

export interface SelectFieldProps<V extends string | number> {
  label: string;
  /** Sayfa başlığı; verilmezse etiket. */
  title?: string;
  options: SelectOption<V>[];
  value: V | null | undefined;
  onChange: (value: V) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  searchable?: boolean;
  emptyText?: string;
}

export function SelectField<V extends string | number>({
  label,
  title,
  options,
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled,
  searchable,
  emptyText,
}: SelectFieldProps<V>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <PickerField
        label={label}
        value={selected?.label}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
        error={error}
        hint={hint}
        disabled={disabled}
      />
      <SelectSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={title ?? label}
        options={options}
        value={value}
        onSelect={onChange}
        searchable={searchable}
        emptyText={emptyText}
      />
    </>
  );
}

export interface DateFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled,
  minDate,
  maxDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PickerField
        label={label}
        value={value ? formatDisplayDate(value) : null}
        placeholder={placeholder}
        icon="calendar-month"
        onPress={() => setOpen(true)}
        error={error}
        hint={hint}
        disabled={disabled}
      />
      <DatePickerSheet
        visible={open}
        value={value}
        title={label}
        minDate={minDate}
        maxDate={maxDate}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </>
  );
}

/**
 * Mutation hatasındaki alan mesajlarını form alanlarına yazar (setError); kalanları döndürür
 * (form üstündeki FormError için).
 */
export function useServerFieldErrors<T extends FieldValues>(
  error: ApiError | null | undefined,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  aliases: Partial<Record<string, Path<T>>> = {},
): string[] {
  const split = splitFieldErrors<Path<T>>(error, fields, aliases);
  const entries = Object.entries(split.fields) as [Path<T>, string][];
  const signature = JSON.stringify(entries);

  useEffect(() => {
    for (const [field, message] of JSON.parse(signature) as [Path<T>, string][]) {
      setError(field, { type: 'server', message });
    }
  }, [signature, setError]);

  return split.rest;
}

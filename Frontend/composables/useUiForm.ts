import type { ComputedRef, InjectionKey, Ref } from 'vue'

/** UiForm ↔ alan bileşenleri (UiTextField, UiSelect, UiCheckbox…) arasındaki sözleşme. */
export type UiRule = (value: any) => true | string | boolean

export interface UiFormField {
  id: number
  isValid: ComputedRef<boolean>
  /** Hataları gösterir ve mesajları döner */
  validate: () => string[]
  reset: () => void
  resetValidation: () => void
}

export const UI_FORM_KEY: InjectionKey<{
  register: (field: UiFormField) => void
  unregister: (id: number) => void
  disabled: ComputedRef<boolean>
}> = Symbol('ui-form')

let nextId = 0

/**
 * Bir alanın kural doğrulaması ve forma kaydı. Hatalar alan "dokunulduktan" (kullanıcı yazınca)
 * ya da form.validate() çağrılınca gösterilir; geçerlilik ise her zaman hesaplanır.
 */
export const useUiField = (opts: {
  value: Ref<any>
  rules: () => UiRule[] | undefined
  error?: () => boolean | undefined
  errorMessages?: () => string | string[] | undefined
  onReset: () => void
}) => {
  const form = inject(UI_FORM_KEY, null)
  const id = ++nextId
  const touched = ref(false)

  const ruleMessages = computed(() => {
    const out: string[] = []
    for (const rule of opts.rules() ?? []) {
      const result = rule(opts.value.value)
      if (result !== true) out.push(typeof result === 'string' ? result : '')
    }
    return out
  })

  const externalMessages = computed(() => {
    const m = opts.errorMessages?.()
    return !m ? [] : Array.isArray(m) ? m : [m]
  })

  const isValid = computed(() => ruleMessages.value.length === 0 && externalMessages.value.length === 0 && !opts.error?.())
  const shownMessages = computed(() => [...externalMessages.value, ...(touched.value ? ruleMessages.value : [])].filter(Boolean))
  const hasError = computed(() => !!opts.error?.() || externalMessages.value.length > 0 || (touched.value && ruleMessages.value.length > 0))

  const field: UiFormField = {
    id,
    isValid,
    validate: () => { touched.value = true; return ruleMessages.value },
    reset: () => { opts.onReset(); touched.value = false },
    resetValidation: () => { touched.value = false },
  }

  form?.register(field)
  onBeforeUnmount(() => form?.unregister(id))

  return {
    id,
    touched,
    hasError,
    shownMessages,
    formDisabled: computed(() => !!form?.disabled.value),
    validate: field.validate,
    reset: field.reset,
    resetValidation: field.resetValidation,
  }
}

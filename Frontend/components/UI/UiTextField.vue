<template>
  <div
    class="ui-field"
    :class="[
      `ui-field--${density}`,
      {
        'ui-field--focused': focused,
        'ui-field--active': active && !labelTop,
        'ui-field--label-top': labelTop,
        'ui-field--error': field.hasError.value,
        'ui-field--disabled': isDisabled,
        'ui-field--multiline': multiline,
        'ui-field--has-label': !!label,
        'ui-field--on-light': lightBg,
        'ui-field--no-spin': hideSpinButtons,
        'ui-field--rounded': isRounded,
      },
      $attrs.class,
    ]"
    :style="[rootStyle, $attrs.style as any]"
  >
    <label v-if="label && labelTop" :for="inputId" class="ui-field__label ui-field__label--top">
      {{ label }}<span v-if="showRequired" class="ui-field__req" aria-hidden="true">*</span>
    </label>
    <div class="ui-field__control" @mousedown="focusOnControl">
      <fieldset class="ui-field__outline" aria-hidden="true">
        <legend><span>{{ (!labelTop && label) || '\u200b' }}</span></legend>
      </fieldset>

      <button
        v-if="prependInnerIcon"
        type="button"
        tabindex="-1"
        class="ui-field__icon ui-field__icon--prepend"
        :class="{ 'ui-field__icon--clickable': hasPrependListener }"
        @click="emit('click:prepend-inner', $event)"
      >
        <UiIcon :icon="prependInnerIcon" :size="iconSize" />
      </button>
      <slot name="prepend-inner" />

      <div class="ui-field__input-wrap">
        <label v-if="label && !labelTop" :for="inputId" class="ui-field__label">{{ label }}</label>
        <textarea
          v-if="multiline"
          :id="inputId"
          ref="inputEl"
          v-bind="inputAttrs"
          :value="displayValue"
          :rows="rows"
          :placeholder="placeholderShown"
          :disabled="isDisabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :aria-invalid="field.hasError.value || undefined"
          :aria-describedby="detailsId"
          class="ui-field__input"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
        <input
          v-else
          :id="inputId"
          ref="inputEl"
          v-bind="inputAttrs"
          :value="displayValue"
          :type="type"
          :placeholder="placeholderShown"
          :disabled="isDisabled"
          :readonly="readonly"
          :maxlength="maxlength"
          :autocomplete="autocomplete"
          :aria-invalid="field.hasError.value || undefined"
          :aria-describedby="detailsId"
          class="ui-field__input"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>

      <button
        v-if="clearable && hasValue && !isDisabled"
        type="button"
        tabindex="-1"
        class="ui-field__icon ui-field__icon--clickable ui-field__clear"
        :aria-label="$t('ui.textField.clear')"
        @click="clear"
      >
        <UiIcon icon="mdi-close-circle" :size="labelTop ? 18 : 20" />
      </button>

      <button
        v-if="appendInnerIcon"
        type="button"
        tabindex="-1"
        class="ui-field__icon ui-field__icon--append"
        :class="{ 'ui-field__icon--clickable': hasAppendListener }"
        @click="emit('click:append-inner', $event)"
      >
        <UiIcon :icon="appendInnerIcon" :size="iconSize" />
      </button>

      <slot name="append-inner" />
    </div>

    <div v-if="showDetails" :id="detailsId" class="ui-field__details">
      <div class="ui-field__messages" :role="field.hasError.value ? 'alert' : undefined">
        <template v-if="currentMessage">
          <slot name="message" :message="currentMessage">{{ currentMessage }}</slot>
        </template>
      </div>
      <div v-if="counterText" class="ui-field__counter">{{ counterText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiField, type UiRule } from '~/composables/useUiForm'

/**
 * Metin alanı (v-text-field / v-textarea karşılığı; Vuetify'daki "outlined" görünüm).
 * Kurallar Vuetify ile aynı biçimde: (value) => true | 'hata mesajı'.
 * Hata, kullanıcı yazınca veya bağlı UiForm'un validate()'i çağrılınca gösterilir.
 * multiline → textarea (rows, autoGrow).
 */
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  label?: string
  type?: string
  placeholder?: string
  rules?: UiRule[]
  prependInnerIcon?: string
  appendInnerIcon?: string
  clearable?: boolean
  disabled?: boolean
  readonly?: boolean
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean | 'auto'
  hint?: string
  /**
   * Etiketin yeri: "top" (varsayılan) alanın üstünde ayrı satır (Dernify formları gibi);
   * "floating" Vuetify'daki gibi alanın içinde, odakta çerçeveye çıkar.
   */
  labelPosition?: 'top' | 'floating'
  /** Etiketin yanında zorunlu (*) işareti */
  required?: boolean
  /** Etiket her zaman yukarıda (yalnızca floating; Vuetify active) */
  active?: boolean
  hideSpinButtons?: boolean
  persistentHint?: boolean
  bgColor?: string
  rounded?: boolean | string
  autocomplete?: string
  maxlength?: number | string
  counter?: boolean | number | string
  error?: boolean
  errorMessages?: string | string[]
  multiline?: boolean
  rows?: number | string
  autoGrow?: boolean
  id?: string
}>(), {
  modelValue: undefined, label: undefined, type: 'text', placeholder: undefined, rules: undefined,
  prependInnerIcon: undefined, appendInnerIcon: undefined, clearable: false, disabled: false, readonly: false,
  density: 'comfortable', hideDetails: false, hint: undefined, persistentHint: false, bgColor: undefined,
  rounded: undefined, autocomplete: undefined, maxlength: undefined, counter: undefined, error: false,
  errorMessages: undefined, labelPosition: 'top', required: false, active: false, hideSpinButtons: false, multiline: false, rows: 5, autoGrow: false, id: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'click:append-inner': [event: MouseEvent]
  'click:prepend-inner': [event: MouseEvent]
  'click:clear': [event: MouseEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const attrs = useAttrs()
const instance = getCurrentInstance()
const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const focused = ref(false)

const value = computed(() => props.modelValue)
const field = useUiField({
  value,
  rules: () => props.rules,
  error: () => props.error,
  errorMessages: () => props.errorMessages,
  onReset: () => emit('update:modelValue', null),
})

const uid = `ui-field-${field.id}`
const inputId = computed(() => props.id ?? uid)
const detailsId = `${uid}-details`

// class/style kökte kalır; diğer öznitelikler ve dinleyiciler (inputmode, name, step, @keydown…) input'a gider
const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs as Record<string, unknown>
  return rest
})

const isDisabled = computed(() => props.disabled || field.formDisabled.value)
const displayValue = computed(() => props.modelValue ?? '')
const hasValue = computed(() => displayValue.value !== '' && displayValue.value !== null)
// Tarih/saat alanlarında tarayıcı kendi şablonunu gösterdiği için etiket hep yukarıda
const active = computed(() => props.active || focused.value || hasValue.value || ['date', 'time', 'datetime-local', 'month'].includes(props.type))
const labelTop = computed(() => props.labelPosition === 'top')
// Üstte etiketli (varsayılan) görünümde ikonlar Dernify'daki gibi 16px
const iconSize = computed(() => (labelTop.value ? 16 : 24))
// Zorunlu yıldızı: required verilmişse ya da kurallardan biri boş değeri reddediyorsa
// (rules.required, password, minLength…). Boşken geçerli sayan kurallar (optionalEmail, phone) yıldız göstermez.
const showRequired = computed(() => props.required || (props.rules ?? []).some((rule) => {
  try { return rule('') !== true } catch { return false }
}))
const placeholderShown = computed(() => (!props.label || labelTop.value || active.value ? props.placeholder : undefined))

const hasAppendListener = computed(() => !!instance?.vnode.props?.['onClick:appendInner'])
const hasPrependListener = computed(() => !!instance?.vnode.props?.['onClick:prependInner'])

const counterMax = computed(() => (typeof props.counter === 'number' || typeof props.counter === 'string' ? props.counter : props.maxlength))
const counterText = computed(() => {
  if (!props.counter) return ''
  const len = String(displayValue.value).length
  return counterMax.value ? `${len} / ${counterMax.value}` : String(len)
})

const currentMessage = computed(() =>
  field.shownMessages.value[0] ?? (props.hint && (props.persistentHint || focused.value) ? props.hint : ''))

const showDetails = computed(() => {
  if (props.hideDetails === true) return false
  if (props.hideDetails === 'auto') return field.shownMessages.value.length > 0 || !!counterText.value || (!!props.hint && (props.persistentHint || focused.value))
  return true
})

const radius = computed(() => {
  return ({ sm: '2px', lg: '8px', xl: '24px' } as Record<string, string>)[props.rounded as string] ?? undefined
})
const lightBg = computed(() => /^(white|#fff(fff)?|grey-lighten-[1-5])$/i.test(props.bgColor ?? ''))
const isRounded = computed(() => props.rounded === true || props.rounded === 'true' || props.rounded === 'pill')
const rootStyle = computed(() => ({
  ...(props.bgColor ? { '--ui-field-bg': uiColor(props.bgColor) } : {}),
  ...(radius.value ? { '--ui-field-radius': radius.value } : {}),
}))

const autoGrow = () => {
  const el = inputEl.value
  if (!props.multiline || !props.autoGrow || !el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const onInput = (e: Event) => {
  field.touched.value = true
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  autoGrow()
}
const onFocus = (e: FocusEvent) => { focused.value = true; emit('focus', e) }
const onBlur = (e: FocusEvent) => { focused.value = false; emit('blur', e) }
const clear = (e: MouseEvent) => {
  emit('update:modelValue', null)
  emit('click:clear', e)
  inputEl.value?.focus()
}
const focusOnControl = (e: MouseEvent) => {
  if (e.target !== inputEl.value && !(e.target as HTMLElement).closest('button')) {
    e.preventDefault()
    inputEl.value?.focus()
  }
}

watch(() => props.modelValue, () => nextTick(autoGrow))
onMounted(autoGrow)

defineExpose({
  focus: () => inputEl.value?.focus(),
  blur: () => inputEl.value?.blur(),
  validate: field.validate,
  reset: field.reset,
  resetValidation: field.resetValidation,
})
</script>

<style scoped>
.ui-field {
  /* Metin rengi; açık zeminli alanda (bg-color="white") koyu kalır */
  --ui-on: var(--color-on-surface);
  --ui-field-bg: transparent;
  --ui-field-radius: 4px;
  --ui-field-border: rgb(var(--ui-on) / 0.38);
  --ui-field-border-hover: rgb(var(--ui-on) / 0.87);
  /* Odak rengi: Vuetify'da color verilmeyince metin rengi; formlardaki .modern-input primary yapar */
  --ui-field-accent: rgb(var(--ui-on));
  --ui-field-height: 56px;
  position: relative;
  width: 100%;
  font-size: 1rem;
  letter-spacing: 0.009375em;
  color: inherit;
}
.ui-field--on-light { --ui-on: 0 0 0; }
.ui-field--comfortable { --ui-field-height: 48px; }
.ui-field--compact { --ui-field-height: 40px; }

.ui-field__control {
  position: relative;
  display: flex;
  align-items: center;
  min-height: var(--ui-field-height);
  padding: 0 12px 0 16px;
  gap: 6px;
  background: var(--ui-field-bg);
  border-radius: var(--ui-field-radius);
  cursor: text;
  transition: background 0.2s, box-shadow 0.2s;
}
/* İkonlu alanda Vuetify gibi daha dar sol boşluk */
.ui-field__control:has(> .ui-field__icon--prepend) { padding-left: 12px; }
/* Çok satırlı: textarea alanın tamamını kaplar, dikey boşluk (yükseklik − 24) / 2 (Vuetify) */
.ui-field--multiline { --ui-field-pad-y: calc((var(--ui-field-height) - 24px) / 2); }
.ui-field--multiline .ui-field__control { align-items: flex-start; }

/* Çerçeve: fieldset + legend, etiket yukarı çıkınca çizgide boşluk açar */
.ui-field__outline {
  position: absolute;
  inset: -5px 0 0;
  margin: 0;
  padding: 0 0 0 var(--ui-field-notch, 12px);
  border: 1px solid var(--ui-field-border);
  border-radius: var(--ui-field-radius);
  pointer-events: none;
  transition: border-color 0.2s;
  min-width: 0;
}
.ui-field__outline legend {
  display: block;
  float: unset;
  width: auto;
  max-width: 0.01px;
  height: 11px;
  padding: 0;
  font-size: 0.75em;
  visibility: hidden;
  white-space: nowrap;
  overflow: hidden;
  transition: max-width 0.05s;
}
.ui-field__outline legend > span { display: inline-block; padding: 0 4px; opacity: 0; }
.ui-field--active .ui-field__outline legend { max-width: 100%; transition: max-width 0.1s 0.05s; }

.ui-field__control:hover .ui-field__outline { border-color: var(--ui-field-border-hover); }
.ui-field--focused .ui-field__outline { border-width: 2px; border-color: var(--ui-field-accent); }
.ui-field--error .ui-field__outline { border-color: rgb(var(--color-error)); }

.ui-field__input-wrap {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
}
.ui-field--multiline .ui-field__input-wrap { align-items: flex-start; }

.ui-field__label {
  position: absolute;
  left: 0;
  top: 50%;
  max-width: 100%;
  transform: translateY(-50%);
  transform-origin: left top;
  color: rgb(var(--ui-on));
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  transition: top 0.15s, transform 0.15s, color 0.15s, font-size 0.15s, left 0.15s;
}
.ui-field--multiline .ui-field__label { top: var(--ui-field-pad-y); transform: none; line-height: 24px; }
/* Yukarı çıkan etiket çerçevenin üst çizgisine, legend'ın açtığı boşluğa oturur */
.ui-field--rounded { --ui-field-notch: calc(var(--ui-field-height) / 2 + 2px); --ui-field-radius: 28px; }
.ui-field--active .ui-field__label {
  top: 0;
  left: calc(var(--ui-field-notch, 12px) + 4px - 16px);
  font-size: 0.75rem;
  transform: translateY(-50%);
}
.ui-field--multiline.ui-field--active .ui-field__label { top: 0; line-height: normal; transform: translateY(-50%); }
.ui-field--active:has(.ui-field__icon--prepend) .ui-field__label { left: calc(var(--ui-field-notch, 12px) + 4px - 42px); }
.ui-field--focused .ui-field__label { color: var(--ui-field-accent); opacity: 1; }
.ui-field--error .ui-field__label { color: rgb(var(--color-error)); opacity: 1; }

/* Üstte ayrı etiket (varsayılan): çevredeki yazı rengini alır, odakta renk değiştirmez */
.ui-field__label.ui-field__label--top {
  position: static;
  display: block;
  max-width: none;
  margin-bottom: 5px;
  transform: none;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: normal;
  white-space: normal;
  color: inherit;
  opacity: 0.85;
  pointer-events: auto;
  cursor: default;
}
.ui-field--error .ui-field__label.ui-field__label--top { color: rgb(var(--color-error)); opacity: 1; }
.ui-field__req { margin-left: 4px; color: rgb(var(--color-error)); }

.ui-field__input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: rgb(var(--ui-on) / 0.87);
  font: inherit;
  letter-spacing: inherit;
  line-height: 1.5;
}
textarea.ui-field__input { resize: none; padding: var(--ui-field-pad-y) 0; line-height: 24px; }
.ui-field__input::placeholder { color: rgb(var(--color-on-surface-variant)); opacity: 0.6; }
.ui-field__input[type='number']::-webkit-inner-spin-button { opacity: 0.6; }
.ui-field--no-spin .ui-field__input::-webkit-inner-spin-button,
.ui-field--no-spin .ui-field__input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.ui-field--no-spin .ui-field__input[type='number'] { -moz-appearance: textfield; }

.ui-field__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: none;
  color: rgb(var(--ui-on));
  opacity: 0.6;
  cursor: default;
}
.ui-field__icon--clickable { cursor: pointer; }
.ui-field__icon--clickable:hover { opacity: 1; }
.ui-field--multiline .ui-field__icon { padding-top: var(--ui-field-pad-y); }
.ui-field--focused .ui-field__icon--prepend { opacity: 1; }
/* Temizle ikonu Vuetify gibi yalnızca üzerine gelince/odakta görünür */
.ui-field__clear { opacity: 0; transition: opacity 0.15s; }
.ui-field__control:hover .ui-field__clear, .ui-field--focused .ui-field__clear { opacity: 0.5; }
.ui-field__control:hover .ui-field__clear:hover { opacity: 1; }

.ui-field--disabled { opacity: 0.38; }
.ui-field--disabled .ui-field__control { cursor: default; }

.ui-field__details {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  min-height: 22px;
  padding: 6px 16px 0;
  font-size: 0.75rem;
  line-height: 12px;
  letter-spacing: 0.0333em;
  color: rgb(var(--ui-on) / 0.6);
}
.ui-field--error .ui-field__messages { color: rgb(var(--color-error)); }
.ui-field__counter { flex-shrink: 0; }

/* ── Üstte etiketli görünüm (varsayılan; Dernify'daki alanlar) ──
   İnce açık kenarlık, 10px köşe, 42px yükseklik, 14px yazı, gri ikonlar;
   odakta marka renginde kenarlık + yumuşak halka. Floating görünüm yukarıdaki Vuetify ölçülerinde kalır. */
.ui-field--label-top {
  --ui-field-bg: rgb(var(--color-surface));
  --ui-field-radius: 10px;
  --ui-field-border: rgb(var(--color-outline-variant) / 0.5);
  --ui-field-border-hover: color-mix(in srgb, rgb(var(--color-brand)) 45%, rgb(var(--color-outline-variant)));
  --ui-field-accent: rgb(var(--color-brand));
  --ui-field-height: 42px;
  font-size: 0.875rem;
  letter-spacing: normal;
}
.ui-field--label-top.ui-field--comfortable { --ui-field-height: 42px; }
.ui-field--label-top.ui-field--compact { --ui-field-height: 36px; }
.ui-field--label-top .ui-field__control,
.ui-field--label-top .ui-field__control:has(> .ui-field__icon--prepend) { padding: 0 12px; gap: 10px; }
/* Etiket üstte olduğu için çerçevede boşluk (legend) yok */
.ui-field--label-top .ui-field__outline { inset: 0; padding: 0; border-width: 1.5px; }
.ui-field--label-top .ui-field__outline legend { display: none; }
.ui-field--label-top.ui-field--focused .ui-field__outline { border-width: 1.5px; }
.ui-field--label-top.ui-field--focused .ui-field__control { box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-field-accent) 12%, transparent); }
.ui-field--label-top.ui-field--error .ui-field__control { box-shadow: 0 0 0 3px rgb(var(--color-error) / 0.15); }
.ui-field--label-top .ui-field__input { color: rgb(var(--ui-on)); }
.ui-field--label-top .ui-field__icon { color: rgb(var(--color-on-surface-variant)); opacity: 0.6; transition: color 0.15s, opacity 0.15s; }
.ui-field--label-top .ui-field__icon--clickable:hover { opacity: 1; }
.ui-field--label-top.ui-field--focused .ui-field__icon--prepend { color: var(--ui-field-accent); opacity: 1; }
.ui-field--label-top .ui-field__details { padding: 4px 2px 0; min-height: 18px; }
</style>

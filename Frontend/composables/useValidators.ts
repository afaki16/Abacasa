export const useValidators = () => {
  const { t } = useI18n()

  const validationRules = {
    required: (value: any) => !!value || t('validation.required'),

    email: (value: string) => {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return pattern.test(value) || t('validation.emailFormat')
    },

    password: (value: string) => {
      if (!value) return t('validation.passwordRequired')
      if (value.length < 8) return t('validation.passwordMinLength', { min: 8 })
      if (!/(?=.*[a-z])/.test(value)) return t('validation.passwordLowercase')
      if (!/(?=.*[A-Z])/.test(value)) return t('validation.passwordUppercase')
      if (!/(?=.*\d)/.test(value)) return t('validation.passwordDigit')
      return true
    },

    confirmPassword: (password: string) => (value: string) => {
      return value === password || t('validation.passwordsDoNotMatch')
    },

    minLength: (min: number) => (value: string) => {
      return value.length >= min || t('validation.minLength', { min })
    },

    maxLength: (max: number) => (value: string) => {
      return value.length <= max || t('validation.maxLength', { max })
    },

    /**
     * Esnek kontrol: "0555 111 22 33", "5551112233", "+90 (555) 111-22-33" hepsi geçer.
     * Asıl doğrulama ve normalizasyon (+905551112233) backend'de (IPhoneNumberService).
     */
    phone: (value: string) => {
      if (!value) return true // Optional field
      const compact = value.replace(/[\s\-().]/g, '').replace(/^00/, '+')
      return /^\+?\d{7,15}$/.test(compact) || t('validation.phoneFormat')
    },

    /** Boşsa geçerli; doluysa e-posta formatı kontrol edilir */
    optionalEmail: (value: string) => {
      if (value === null || value === undefined || String(value).trim() === '') return true
      return validationRules.email(value as string)
    },

    /** Boşsa geçerli; doluysa telefon formatı kontrol edilir */
    optionalPhone: (value: string) => {
      if (value === null || value === undefined || String(value).trim() === '') return true
      return validationRules.phone(value)
    },

    /** T.C. Kimlik No: 11 hane, ilk hane 0 değil, iki kontrol hanesi (backend: TcKimlikValidator) */
    tcKimlik: (value: string) => {
      if (!value) return t('validation.required')
      if (!/^[1-9]\d{10}$/.test(value)) return t('validation.tcKimlikInvalid')
      const d = value.split('').map(Number)
      const oddSum = d[0] + d[2] + d[4] + d[6] + d[8]
      const evenSum = d[1] + d[3] + d[5] + d[7]
      // JS'te % negatif sonuç verebilir; pozitif moda çevir (yoksa geçerli numaralar reddedilir)
      if ((((oddSum * 7 - evenSum) % 10) + 10) % 10 !== d[9]) return t('validation.tcKimlikInvalid')
      if (d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 !== d[10]) return t('validation.tcKimlikInvalid')
      return true
    },

    /** Boşsa geçerli; doluysa T.C. Kimlik No kontrol edilir */
    optionalTcKimlik: (value: string) => {
      if (value === null || value === undefined || String(value).trim() === '') return true
      return validationRules.tcKimlik(String(value).trim())
    }
  }

  return {
    validationRules
  }
}

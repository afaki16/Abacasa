<template>
  <div class="login-page">
    <div class="lang-switcher-wrapper">
      <LanguageSwitcher />
    </div>
    <!-- LEFT: Image Carousel -->
    <div class="left-panel">
      <div
        v-for="(image, index) in backgroundImages"
        :key="index"
        :class="['carousel-slide', { active: currentImageIndex === index }]"
        :style="{ backgroundImage: `url(${image})` }"
      />
      <div class="left-overlay" />
      <div class="left-content">
        <div class="brand-badge">
          <Icon name="mdi:lightning-bolt" class="brand-badge-icon" />
          <span>{{ t("auth.brandBadge") }}</span>
        </div>
        <h2 class="left-title">
          {{ t("auth.heroTitle") }}
        </h2>
        <p class="left-subtitle">
          {{ t("auth.heroSubtitle") }}
        </p>
        <div class="carousel-dots">
          <div
            v-for="(_, index) in backgroundImages"
            :key="index"
            :class="['dot', { active: currentImageIndex === index }]"
            @click="goToSlide(index)"
          />
        </div>
      </div>
    </div>

    <!-- RIGHT: Login Form -->
    <div class="right-panel">
      <div class="right-inner">
        <div class="form-header">
          <div class="form-header-logo">
            <img :src="logoSrc" :alt="logoAlt" class="form-header-logo-img" />
          </div>
          <h1>{{ t("auth.welcomeBack") }}</h1>
          <p>
            {{ t("auth.signInSubtitle") }}
          </p>
        </div>

        <!-- Session Expired Alert -->
        <AlertBox
          v-if="showSessionExpiredAlert"
          variant="warning"
          :message="t('auth.sessionExpired')"
          @close="showSessionExpiredAlert = false"
        />

        <!-- Hesap silindikten sonra -->
        <AlertBox
          v-if="route.query.accountDeleted && !accountDeletedDismissed"
          variant="success"
          message="Hesabınız silindi."
          @close="accountDeletedDismissed = true"
        />

        <!-- Login API errors (from /api/auth/login) -->
        <AlertBox
          v-if="loginApiErrors.length > 0 && !emailNotConfirmed"
          variant="error"
          :message="loginApiErrors"
          @close="loginApiErrors = []"
        />

        <!-- Email not confirmed: show inline resend block -->
        <AlertBox
          v-if="emailNotConfirmed"
          :variant="resendAlertType"
          :message="resendAlertMessage"
          @close="onCloseEmailNotConfirmed"
        >
          <button
            type="button"
            class="resend-btn mt-2"
            :disabled="resending || resendButtonDisabled"
            @click="onResendVerification"
          >
            <Icon
              :name="resending ? 'mdi:loading' : resendButtonIcon"
              class="resend-btn-icon"
              :class="{ 'animate-spin': resending }"
            />
            {{ resendButtonText }}
          </button>
        </AlertBox>

        <form novalidate @submit.prevent="handleLogin">
          <div class="input-group">
            <label for="login-email">{{ t("auth.email") }}</label>
            <div>
              <div
                class="custom-input"
                :class="{ 'custom-input--error': showEmailError }"
              >
                <Icon name="mdi:email-outline" class="custom-input-icon" />
                <input
                  id="login-email"
                  v-model="form.email"
                  type="email"
                  autocomplete="email"
                  :placeholder="t('auth.emailPlaceholder')"
                  :aria-invalid="showEmailError"
                  :aria-describedby="showEmailError ? 'login-email-error' : undefined"
                  autofocus
                  @input="touched.email = true"
                />
              </div>
              <p v-if="showEmailError" id="login-email-error" class="input-error">
                {{ emailError }}
              </p>
            </div>
          </div>

          <div class="input-group">
            <label for="login-password">{{ t("auth.password") }}</label>
            <div>
              <div
                class="custom-input"
                :class="{ 'custom-input--error': showPasswordError }"
              >
                <Icon name="mdi:lock-outline" class="custom-input-icon" />
                <input
                  id="login-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  :placeholder="t('auth.passwordPlaceholder')"
                  :aria-invalid="showPasswordError"
                  :aria-describedby="showPasswordError ? 'login-password-error' : undefined"
                  @input="touched.password = true"
                />
                <button
                  type="button"
                  class="custom-input-toggle"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <Icon
                    :name="showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
                    class="custom-input-icon"
                  />
                </button>
              </div>
              <p v-if="showPasswordError" id="login-password-error" class="input-error">
                {{ passwordError }}
              </p>
            </div>
          </div>

          <div
            class="options-row"
            :class="{ 'options-row--no-forgot': !showForgotPassword }"
          >
            <label class="remember-checkbox">
              <input v-model="form.rememberMe" type="checkbox" />
              <span>{{ t("auth.rememberMe") }}</span>
            </label>
            <a
              v-if="showForgotPassword"
              class="forgot-link"
              @click.prevent="$router.push('/auth/forgot-password')"
            >
              {{ t("auth.forgotPassword") }}
            </a>
          </div>

          <button
            type="submit"
            class="login-btn"
            :disabled="!isFormValid || authStore.isLoading"
            :aria-busy="authStore.isLoading"
          >
            <Icon
              v-if="authStore.isLoading"
              name="mdi:loading"
              class="login-btn-spinner animate-spin"
            />
            <span v-else>{{ t("auth.login") }}</span>
          </button>
        </form>

        <!-- Register Section (controlled by showRegister prop) -->
        <template v-if="showRegister">
          <div class="divider">
            <span>{{ t("auth.or") }}</span>
          </div>

          <div class="register-section">
            <p>
              {{ t("auth.noAccount") }}
            </p>
            <button
              type="button"
              class="register-btn"
              @click="$router.push('/auth/register')"
            >
              <Icon name="mdi:account-plus-outline" class="register-btn-icon" />
              {{ t("auth.createAccount") }}
            </button>
          </div>
        </template>

        <div class="legal-links">
          <NuxtLink :to="LEGAL_ROUTES.privacy">Aydınlatma metni</NuxtLink>
          <span>·</span>
          <NuxtLink :to="LEGAL_ROUTES.terms">Kullanım koşulları</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoginRequest } from "~/types";
import { parseApiErrorMessages } from "~/utils/apiError";
import { ErrorCode } from "~/utils/errorCodes";
import { consumeSessionExpired } from "~/utils/authRoutes";
import { LEGAL_ROUTES } from "~/utils/legal";

const props = withDefaults(
  defineProps<{
    showRegister?: boolean;
    showForgotPassword?: boolean;
  }>(),
  {
    showRegister: true, // false: register gizli, true yapınca açılır
    showForgotPassword: true, // false: forgot password linki gizli, true: gösterilir
  },
);

const { t } = useI18n();
const route = useRoute();
const authStore = useAuthStore();
const { validationRules } = useValidators();
const { getBackgroundImages, getLoginConfig, getLogo } = useAppData();

const logoSrc = computed(() => getLogo.value?.src || "/favicon.ico");
const logoAlt = computed(() => getLogo.value?.alt || "Logo");

const showPassword = ref(false);
const loginApiErrors = ref<string[]>([]);
const emailNotConfirmed = ref(false);
const showSessionExpiredAlert = ref(false);
const accountDeletedDismissed = ref(false);
const resending = ref(false);
const currentImageIndex = ref(0);

// Resend verification UI state
const resendState = ref<"idle" | "sent" | "error">("idle");
const resendCooldown = ref(0);
let resendTimer: ReturnType<typeof setInterval> | null = null;
let resendErrorTimeout: ReturnType<typeof setTimeout> | null = null;

const clearResendTimers = () => {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
  if (resendErrorTimeout) {
    clearTimeout(resendErrorTimeout);
    resendErrorTimeout = null;
  }
};

const resendAlertType = computed<"warning" | "success" | "error">(() => {
  if (resendState.value === "sent") return "success";
  if (resendState.value === "error") return "error";
  return "warning";
});

const resendAlertMessage = computed(() => {
  if (resendState.value === "sent") {
    return t("auth.resendEmailSent");
  }
  if (resendState.value === "error") {
    return t("auth.resendEmailError");
  }
  return t("auth.emailNotConfirmed");
});

const resendButtonDisabled = computed(
  () => resendState.value === "sent" && resendCooldown.value > 0,
);

const resendButtonText = computed(() => {
  if (resendState.value === "sent" && resendCooldown.value > 0) {
    return `${t("auth.resendButtonSent")} (${resendCooldown.value}s)`;
  }
  return t("auth.resendButton");
});

const resendButtonIcon = computed(() =>
  resendState.value === "sent" && resendCooldown.value > 0
    ? "mdi:check-circle-outline"
    : "mdi:email-sync-outline",
);

const onCloseEmailNotConfirmed = () => {
  emailNotConfirmed.value = false;
  loginApiErrors.value = [];
  clearResendTimers();
  resendState.value = "idle";
  resendCooldown.value = 0;
};

const backgroundImages = computed(() => getBackgroundImages.value || []);
const loginConfig = computed(() => getLoginConfig.value);

const form = reactive<LoginRequest>({
  email: "",
  password: "",
  rememberMe: false,
  deviceId: "",
  deviceName: "",
});

// ── Validation ──
// Vuetify'ın varsayılan davranışı (validate-on="input"): hata, kullanıcı alana yazdıktan
// veya submit denendikten sonra görünür; yalnızca odaklanıp çıkmak hata göstermez.
type Rule = (value: any) => true | string;

const firstError = (value: unknown, rules: Rule[]) => {
  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) return result;
  }
  return "";
};

const touched = reactive({ email: false, password: false });

const emailError = computed(() =>
  firstError(form.email, [validationRules.required, validationRules.email]),
);
const passwordError = computed(() =>
  firstError(form.password, [validationRules.required]),
);

const showEmailError = computed(() => touched.email && !!emailError.value);
const showPasswordError = computed(
  () => touched.password && !!passwordError.value,
);

const isFormValid = computed(() => !emailError.value && !passwordError.value);

// ── Carousel Logic ──
let imageInterval: ReturnType<typeof setInterval>;
let isPaused = false;

const goToSlide = (index: number) => {
  currentImageIndex.value = index;
};

const nextSlide = () => {
  if (!isPaused && backgroundImages.value.length > 0) {
    currentImageIndex.value =
      (currentImageIndex.value + 1) % backgroundImages.value.length;
  }
};

// ── Login Handler ──
const handleLogin = async () => {
  touched.email = true;
  touched.password = true;
  if (!isFormValid.value) return;
  loginApiErrors.value = [];
  emailNotConfirmed.value = false;
  clearResendTimers();
  resendState.value = "idle";
  resendCooldown.value = 0;
  try {
    // ?redirect= yalnızca uygulama içi yolsa kullanılır (login içinde süzülür)
    await useAuth().login(form, route.query.redirect as string | undefined);
  } catch (error: any) {
    console.error("Login failed:", error);
    loginApiErrors.value = parseApiErrorMessages(error);
    const code = error?.response?.data?.error?.code ?? error?.data?.error?.code;
    if (code === ErrorCode.EmailNotConfirmed) {
      emailNotConfirmed.value = true;
    }
  }
};

const onResendVerification = async () => {
  if (!form.email) return;
  if (resendState.value === "sent" && resendCooldown.value > 0) return;
  resending.value = true;
  try {
    await useAuth().resendVerification(form.email);
    clearResendTimers();
    resendState.value = "sent";
    resendCooldown.value = 60;
    resendTimer = setInterval(() => {
      resendCooldown.value -= 1;
      if (resendCooldown.value <= 0) {
        resendCooldown.value = 0;
        clearResendTimers();
        // Alert yeşil kalsın (kullanıcı yeni mail bekliyor); sadece buton tekrar aktif olsun.
      }
    }, 1000);
  } catch {
    clearResendTimers();
    resendState.value = "error";
    resendCooldown.value = 0;
    resendErrorTimeout = setTimeout(() => {
      resendState.value = "idle";
      resendErrorTimeout = null;
    }, 5000);
  } finally {
    resending.value = false;
  }
};

// ── Lifecycle ──
onMounted(() => {
  // Pre-fill email from query
  const registeredEmail = route.query.email as string;
  if (registeredEmail) form.email = registeredEmail;

  // Tek seferlik okunur ve silinir; F5'te uyarı tekrar çıkmaz
  showSessionExpiredAlert.value = consumeSessionExpired();

  // NOT: deviceId ve deviceName artık useAuth.login() içinde otomatik üretiliyor
  // (cookie-based, localStorage'a yazmıyor). Burada manuel set etmeye gerek yok.
  // Eski localStorage-based deviceId kodu güvenlik nedeniyle kaldırıldı.

  // Start carousel
  imageInterval = setInterval(
    nextSlide,
    loginConfig.value?.rotationInterval || 3000,
  );
});

onUnmounted(() => {
  if (imageInterval) clearInterval(imageInterval);
  clearResendTimers();
});
</script>

<style scoped>
/* ── Variables ── */
.login-page {
  --lp-bg: #0a0a0f;
  --lp-card-border: rgba(255, 255, 255, 0.06);
  --lp-input-bg: rgba(255, 255, 255, 0.04);
  --lp-input-border: rgba(255, 255, 255, 0.1);
  --lp-accent: #818cf8;
  --lp-accent-glow: rgba(129, 140, 248, 0.25);
  --lp-gradient: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  --lp-text: #f1f1f4;
  --lp-text-secondary: rgba(255, 255, 255, 0.5);
  --lp-text-muted: rgba(255, 255, 255, 0.3);

  display: flex;
  min-height: 100vh;
  background: var(--lp-bg);
  color: var(--lp-text);
  font-family: inherit;
}

/* ── LEFT PANEL ── */
.left-panel {
  flex: 1.1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.carousel-slide {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  /* Sadece crossfade — zoom/scale yok (önceki “geri küçülme” hissi kalkar) */
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0);
  backface-visibility: hidden;
}

.carousel-slide.active {
  z-index: 1;
  opacity: 1;
}

.left-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, transparent 60%, var(--lp-bg) 100%),
    linear-gradient(to top, rgba(10, 10, 15, 0.85) 0%, transparent 50%),
    linear-gradient(to bottom, rgba(10, 10, 15, 0.3) 0%, transparent 30%);
  z-index: 2;
}

.left-content {
  position: relative;
  z-index: 3;
  padding: 48px;
  width: 100%;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  padding: 8px 18px;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 24px;
}

.left-title {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.15;
  color: white;
  margin-bottom: 14px;
  max-width: 440px;
}

.left-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.6;
  max-width: 400px;
}

.carousel-dots {
  display: flex;
  gap: 8px;
  margin-top: 28px;
}

.dot {
  width: 32px;
  height: 3px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.5s ease;
  cursor: pointer;
}

.dot.active {
  width: 48px;
  background: var(--lp-accent);
  box-shadow: 0 0 12px var(--lp-accent-glow);
}

/* ── RIGHT PANEL ── */
.right-panel {
  flex: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  z-index: 5;
  /* Süs ışıması (::before, right: -200px) ekran dışına taşıp mobilde sayfayı genişletmesin */
  overflow-x: clip;
}

.right-panel::before {
  content: "";
  position: absolute;
  top: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.06),
    transparent 70%
  );
  pointer-events: none;
}

.right-inner {
  width: 100%;
  max-width: 400px;
  animation: fadeUp 0.7s 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Form Header */
.form-header {
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.form-header-logo {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-header-logo-img {
  max-height: 56px;
  width: auto;
  max-width: min(220px, 100%);
  height: auto;
  object-fit: contain;
  display: block;
}

.form-header h1 {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 6px;
  width: 100%;
}

.form-header p {
  color: var(--lp-text-secondary);
  font-size: 0.92rem;
  width: 100%;
}

/* Input Groups */
.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--lp-text-secondary);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.custom-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  background: var(--lp-input-bg);
  border: 1px solid var(--lp-input-border);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.custom-input:focus-within {
  border-color: var(--lp-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.custom-input--error,
.custom-input--error:focus-within {
  border-color: #f87171;
}

.custom-input input {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--lp-text);
  font-size: 1rem;
}

.custom-input input::placeholder {
  color: var(--lp-text-muted);
}

/* Tarayıcı otomatik doldurmasında beyaz arka planı engelle */
.custom-input input:-webkit-autofill {
  -webkit-text-fill-color: var(--lp-text);
  -webkit-box-shadow: 0 0 0 1000px #15151c inset;
  caret-color: var(--lp-text);
}

.custom-input-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);
}

.custom-input-toggle {
  display: flex;
  align-items: center;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.input-error {
  margin-top: 6px;
  padding-left: 4px;
  font-size: 0.75rem;
  color: #f87171;
}

/* Options Row */
.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

.options-row--no-forgot {
  justify-content: flex-start;
}

.remember-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--lp-text-secondary);
  cursor: pointer;
  user-select: none;
}

.remember-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--lp-accent);
  cursor: pointer;
}

.forgot-link {
  font-size: 0.85rem;
  color: var(--lp-accent);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #a5b4fc;
}

/* Login Button */
.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  background: var(--lp-gradient);
  color: white;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.35);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-btn[aria-busy="true"] {
  opacity: 0.85;
  cursor: progress;
}

.login-btn-spinner {
  width: 24px;
  height: 24px;
}

.brand-badge-icon {
  width: 16px;
  height: 16px;
  color: white;
}

/* Resend verification button (inside AlertBox) */
.resend-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 6px;
  color: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
}

.resend-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.resend-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resend-btn-icon {
  width: 16px;
  height: 16px;
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 28px 0;
}

.divider span {
  font-size: 0.8rem;
  color: var(--lp-text-muted);
  white-space: nowrap;
}

.divider::before,
.divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--lp-card-border);
}

/* Register Section */
.register-section {
  text-align: center;
}

.register-section p {
  font-size: 0.88rem;
  color: var(--lp-text-secondary);
  margin-bottom: 14px;
}

.register-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 18px;
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  color: var(--lp-text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-btn:hover {
  border-color: var(--lp-accent);
  background: rgba(99, 102, 241, 0.06);
  transform: translateY(-1px);
}

.register-btn-icon {
  width: 18px;
  height: 18px;
}

.legal-links {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 0.82rem;
  color: var(--lp-text-secondary);
}

.legal-links a {
  color: inherit;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
  .left-panel {
    display: none;
  }
  .right-panel {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .right-panel {
    padding: 24px 20px;
  }
  .form-header h1 {
    font-size: 1.4rem;
  }
}

.lang-switcher-wrapper {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 100;
}
</style>

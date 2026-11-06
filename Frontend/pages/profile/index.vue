<template>
  <div class="profile-page">
    <div class="mb-6">
      <BreadCrumb
        :items="[{ text: $t('common.home'), to: '/dashboard' }, { text: $t('profile.title') }]"
      />
    </div>

    <!-- ═══════════════ HERO ═══════════════ -->
    <div class="page-hero">
      <div class="hero-banner">
        <div class="hero-status" :class="`status-${statusColor}`">
          <UiIcon
            :icon="statusColor === 'success' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'"
            :size="13"
          />
          {{ statusLabel }}
        </div>
      </div>

      <!-- Avatar kapak sınırının üstüne taşar, isim/e-posta hemen yanında -->
      <div class="hero-body">
        <div class="avatar-wrap">
          <ProfilePhotoEditor
            :url="user?.profileImageUrl"
            :initials="initials"
            :size="80"
            class="profile-avatar"
          />
          <span class="online-dot" />
        </div>
        <div class="hero-meta">
          <h1 class="hero-name">{{ user?.fullName || "—" }}</h1>
          <p class="hero-email">
            <UiIcon icon="mdi-email-outline" :size="13" />
            {{ user?.email }}
          </p>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-pill">
          <UiIcon icon="mdi-calendar-account-outline" :size="18" class="stat-icon" />
          <div>
            <div class="stat-val">{{ memberDays }}</div>
            <div class="stat-lbl">{{ $t('profile.stats.memberDays') }}</div>
          </div>
        </div>
        <div class="stat-sep" />
        <div class="stat-pill">
          <UiIcon icon="mdi-login-variant" :size="18" class="stat-icon" />
          <div>
            <div class="stat-val">{{ lastLoginShort }}</div>
            <div class="stat-lbl">{{ $t('profile.lastLogin') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ TABS ═══════════════ -->
    <nav class="profile-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="profile-tab"
        :class="{ 'profile-tab--active': activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <UiIcon :icon="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </nav>

    <!-- ═══════════════ TAB: PROFİL ═══════════════ -->
    <div v-if="activeTab === 'profile'" class="tab-content">
      <div class="card">
        <div class="card-header">
          <div class="card-icon"><UiIcon icon="mdi-account-circle-outline" :size="16" /></div>
          <span>{{ $t('profile.account.title') }}</span>
          <button type="button" class="edit-btn" @click="openProfileDialog">
            <UiIcon icon="mdi-pencil-outline" :size="14" /> {{ $t('common.edit') }}
          </button>
        </div>
        <div class="card-divider" />

        <div class="info-grid">
          <div class="info-tile">
            <span class="tile-lbl">{{ $t('auth.firstNameLabel') }}</span>
            <span class="tile-val">{{ user?.firstName || "—" }}</span>
          </div>
          <div class="info-tile">
            <span class="tile-lbl">{{ $t('auth.lastNameLabel') }}</span>
            <span class="tile-val">{{ user?.lastName || "—" }}</span>
          </div>

          <div class="info-tile info-tile--wide">
            <span class="tile-lbl">{{ $t('household.email') }}</span>
            <div class="tile-val-row">
              <span class="tile-val">{{ user?.email }}</span>
              <span class="confirm-badge" :class="user?.emailConfirmed ? 'confirm-ok' : 'confirm-warn'">
                <UiIcon :icon="user?.emailConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle-outline'" :size="12" />
                {{ user?.emailConfirmed ? $t('profile.account.verified') : $t('profile.account.notVerified') }}
              </span>
              <button type="button" class="link-inline-btn" @click="openEmailDialog">
                {{ $t('profile.account.changeEmail') }}
              </button>
            </div>
          </div>

          <div class="info-tile info-tile--wide">
            <span class="tile-lbl">{{ $t('profile.account.phone') }}</span>
            <div v-if="user?.phoneNumber" class="tile-val-row">
              <span class="tile-val">{{ user.phoneNumber }}</span>
              <span class="confirm-badge" :class="user?.phoneConfirmed ? 'confirm-ok' : 'confirm-warn'">
                <UiIcon :icon="user?.phoneConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle-outline'" :size="12" />
                {{ user?.phoneConfirmed ? $t('profile.account.verified') : $t('profile.account.notVerified') }}
              </span>
            </div>
            <span v-else class="tile-val tile-val--muted">{{ $t('profile.account.notSpecified') }}</span>
          </div>

          <div class="info-tile">
            <span class="tile-lbl">{{ $t('profile.account.createdDate') }}</span>
            <span class="tile-val">{{ user?.createdDate ? dateFormat(user.createdDate) : "—" }}</span>
          </div>
          <div class="info-tile">
            <span class="tile-lbl">{{ $t('profile.lastLogin') }}</span>
            <span class="tile-val tile-val--sm">{{ user?.lastLoginDate ? dateTimeFormat(user.lastLoginDate) : "—" }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════ TAB: GÜVENLİK ═══════════════ -->
    <div v-if="activeTab === 'security'" class="tab-content">
      <!-- Şifre değiştir -->
      <div class="card security-card mb-4">
        <div class="card-header">
          <div class="card-icon"><UiIcon icon="mdi-lock-reset" :size="16" /></div>
          <span>{{ $t('profile.password.title') }}</span>
        </div>
        <div class="card-divider" />

        <!-- Mevcut şifre ya da e-postaya gelen 6 haneli kod -->
        <div class="pwd-mode-tabs">
          <button type="button" class="pwd-mode-btn" :class="{ active: !useCode }" @click="useCode = false">
            <UiIcon icon="mdi-key-outline" :size="14" /> {{ $t('profile.password.knowCurrent') }}
          </button>
          <button type="button" class="pwd-mode-btn" :class="{ active: useCode }" @click="switchToCode">
            <UiIcon icon="mdi-email-lock-outline" :size="14" /> {{ $t('profile.password.forgot') }}
          </button>
        </div>

        <div class="p-4">
          <UiForm
            ref="passwordFormRef"
            @submit="submitChangePassword"
          >
            <template v-if="!useCode">
              <UiTextField
                v-model="currentPassword"
                :label="$t('auth.currentPasswordLabel')"
                placeholder="••••••••"
                :type="showCurrent ? 'text' : 'password'"
                :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[validationRules.required]"
                density="comfortable"
                class="mb-3"
                @click:append-inner="showCurrent = !showCurrent"
              />
            </template>

            <template v-else>
              <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-3">
                <i18n-t keypath="profile.password.codeInfo" tag="span" scope="global">
                  <template #email><strong>{{ user?.email }}</strong></template>
                </i18n-t>
              </p>
              <div class="flex gap-2 items-start mb-3">
                <UiTextField
                  v-model="passwordCode"
                  :label="$t('profile.password.codeLabel')"
                  :placeholder="$t('profile.password.codePlaceholder')"
                  inputmode="numeric"
                  maxlength="6"
                  autocomplete="one-time-code"
                  :rules="[validationRules.required]"
                  density="comfortable"
                  class="flex-1"
                />
                <!-- Etiket alanın üstünde: düğme giriş kutusuyla aynı hizada başlasın -->
                <UiBtn
                  variant="tonal"
                  color="primary"
                  class="code-btn mt-[23px]"
                  style="height: 42px"
                  :loading="sendingCode"
                  :disabled="codeCooldown > 0"
                  @click="sendCode"
                >
                  {{ codeCooldown > 0 ? $t('auth.secondsShort', { s: codeCooldown }) : codeSent ? $t('auth.resendAgain') : $t('profile.password.sendCode') }}
                </UiBtn>
              </div>
            </template>
            <UiTextField
              v-model="newPassword"
              :label="$t('auth.newPasswordLabel')"
              placeholder="••••••••"
              :type="showNew ? 'text' : 'password'"
              :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="[validationRules.password]"
              density="comfortable"
              class="mb-3"
              @click:append-inner="showNew = !showNew"
            />
            <UiTextField
              v-model="confirmNewPassword"
              :label="$t('profile.password.confirmNew')"
              placeholder="••••••••"
              required
              :type="showConfirm ? 'text' : 'password'"
              :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="[validationRules.confirmPassword(newPassword)]"
              density="comfortable"
              class="mb-4"
              @click:append-inner="showConfirm = !showConfirm"
            />
            <UiBtn
              type="submit"
              color="primary"
              :loading="isChangingPassword"
              block
            >
              {{ $t('auth.resetPasswordButton') }}
            </UiBtn>
          </UiForm>
        </div>
      </div>

      <!-- Oturumlar -->
      <div class="card">
        <div class="card-header">
          <div class="card-icon"><UiIcon icon="mdi-monitor-multiple" :size="16" /></div>
          <span>{{ $t('profile.sessions.title') }}</span>
          <span v-if="!loadingSessions && activeSessions.length" class="count-badge">
            {{ activeSessions.length }}
          </span>
          <div class="flex-1" />
          <UiBtn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-refresh"
            :loading="loadingSessions"
            @click="loadSessions"
          >
            {{ $t('common.refresh') }}
          </UiBtn>
          <UiBtn
            v-if="activeSessions.length"
            size="small"
            variant="tonal"
            color="error"
            prepend-icon="mdi-logout-variant"
            :loading="loggingOutAll"
            @click="confirmLogoutAll = true"
          >
            {{ $t('profile.sessions.logoutAll') }}
          </UiBtn>
        </div>
        <div class="card-divider" />

        <UiProgressLinear
          v-if="loadingSessions"
          indeterminate
          color="primary"
        />

        <!-- Empty -->
        <div
          v-if="!loadingSessions && !sessions.length"
          class="empty-state"
        >
          <UiIcon icon="mdi-monitor-off" :size="24" />
          {{ $t('profile.sessions.empty') }}
        </div>

        <!-- Active sessions -->
        <div
          v-if="!loadingSessions && activeSessions.length"
          class="session-list"
        >
          <div
            v-for="session in activeSessions"
            :key="session.id"
            class="session-card"
            :class="{ 'session-card--current': session.isCurrentSession }"
          >
            <div class="session-icon" :class="{ 'session-icon--current': session.isCurrentSession }">
              <UiIcon :icon="deviceIcon(session.deviceType)" :size="20" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="session-name">{{ session.deviceName }}</span>
                <UiChip
                  v-if="session.isCurrentSession"
                  size="x-small"
                  color="primary"
                  variant="flat"
                  rounded
                >
                  {{ $t('profile.sessions.thisDevice') }}
                </UiChip>
              </div>
              <div class="session-meta mt-1">
                <span>
                  <UiIcon icon="mdi-ip-network-outline" :size="11" />
                  {{ session.ipAddress }}
                </span>
                <span class="mx-1 opacity-30">·</span>
                <span>
                  <UiIcon icon="mdi-calendar-outline" :size="11" />
                  {{ formatDate(session.createdDate) }}
                </span>
                <span class="mx-1 opacity-30">·</span>
                <span class="session-remaining">
                  <UiIcon icon="mdi-clock-outline" :size="11" />
                  {{ $t('profile.sessions.remaining', { time: remainingLabel(session) }) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive (collapsible) -->
        <div
          v-if="!loadingSessions && inactiveSessions.length"
          class="history-wrap"
        >
          <div
            class="history-toggle"
            @click="showHistory = !showHistory"
          >
            <UiIcon :icon="showHistory ? 'mdi-chevron-up' : 'mdi-chevron-down'" :size="16" />
            {{ $t('profile.sessions.history', { count: inactiveSessions.length }) }}
          </div>

          <div v-if="showHistory" class="session-list session-list--history">
            <div
              v-for="session in inactiveSessions"
              :key="session.id"
              class="session-card session-card--inactive"
            >
              <div class="session-icon">
                <UiIcon :icon="deviceIcon(session.deviceType)" :size="20" />
              </div>
              <div class="flex-1 min-w-0">
                <span class="session-name">{{ session.deviceName }}</span>
                <div class="session-meta mt-1">
                  <span>
                    <UiIcon icon="mdi-ip-network-outline" :size="11" />
                    {{ session.ipAddress }}
                  </span>
                  <span class="mx-1 opacity-30">·</span>
                  <span>
                    <UiIcon icon="mdi-calendar-outline" :size="11" />
                    {{ formatDate(session.createdDate) }}
                  </span>
                  <span class="mx-1 opacity-30">·</span>
                  <span class="session-ended">{{ $t('profile.sessions.ended') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hesap ve veriler: kişisel veri indirme (KVKK) ve hesabı silme -->
      <h2 class="group-title">{{ $t('profile.data.groupTitle') }}</h2>
      <div class="panel-card">
        <div class="panel-card__header">
          <div class="panel-card__icon"><UiIcon icon="mdi-microsoft-excel" :size="16" /></div>
          <span>{{ $t('profile.data.title') }}</span>
        </div>
        <div class="panel-card__divider" />
        <div class="panel-card__body">
          <p class="panel-card__hint">{{ $t('profile.data.hint') }}</p>
          <UiBtn color="primary" variant="tonal" prepend-icon="mdi-download" :loading="exporting" :disabled="exporting" @click="exportMyData">
            {{ $t('profile.data.export') }}
          </UiBtn>
        </div>
      </div>
      <DeleteAccountSection />
    </div>

    <!-- Bilgilerimi düzenle -->
    <UiDialog v-model="profileDialog" max-width="460">
      <UiCard rounded="xl">
        <div class="dialog-head">
          <div class="dialog-head__icon"><UiIcon icon="mdi-account-edit-outline" :size="20" /></div>
          <div>
            <h3 class="dialog-head__title">{{ $t('profile.edit.title') }}</h3>
            <p class="dialog-head__sub">{{ $t('profile.edit.subtitle') }}</p>
          </div>
        </div>
        <div class="dialog-body">
          <UiForm ref="profileFormRef" @submit="saveProfile">
            <UiTextField
              v-model="profileForm.firstName"
              :label="$t('auth.firstNameLabel')"
              :placeholder="$t('profile.edit.firstNamePlaceholder')"
              density="comfortable"
              :rules="[validationRules.required]"
              :disabled="savingProfile"
              class="mb-2"
            />
            <UiTextField
              v-model="profileForm.lastName"
              :label="$t('auth.lastNameLabel')"
              :placeholder="$t('profile.edit.lastNamePlaceholder')"
              density="comfortable"
              :rules="[validationRules.required]"
              :disabled="savingProfile"
              class="mb-2"
            />
            <UiTextField
              v-model="profileForm.phoneNumber"
              :label="$t('profile.account.phone')"
              placeholder="0555 000 00 00"
              density="comfortable"
              type="tel"
              :rules="[validationRules.phone]"
              :disabled="savingProfile"
            />
            <UiAlert v-if="profileError" type="error" variant="tonal" density="compact" class="mt-2">
              {{ profileError }}
            </UiAlert>
          </UiForm>
        </div>
        <div class="dialog-actions">
          <UiBtn variant="outlined" class="btn-gradient-dark" :disabled="savingProfile" @click="profileDialog = false">{{ $t('common.cancel') }}</UiBtn>
          <UiBtn class="btn-gradient-primary" :loading="savingProfile" @click="saveProfile">{{ $t('common.save') }}</UiBtn>
        </div>
      </UiCard>
    </UiDialog>

    <!-- E-posta değiştir: değişiklik yeni adrese giden link onaylanınca uygulanır -->
    <UiDialog v-model="emailDialog" max-width="460">
      <UiCard rounded="xl">
        <div class="dialog-head">
          <div class="dialog-head__icon"><UiIcon icon="mdi-email-edit-outline" :size="20" /></div>
          <div>
            <h3 class="dialog-head__title">{{ $t('profile.email.title') }}</h3>
            <p class="dialog-head__sub">{{ $t('profile.email.subtitle') }}</p>
          </div>
        </div>
        <div class="dialog-body">
          <template v-if="emailSentTo">
            <UiAlert type="success" variant="tonal" class="mb-2">
              <i18n-t keypath="profile.email.sent" tag="span" scope="global">
                <template #email><strong>{{ emailSentTo }}</strong></template>
              </i18n-t>
            </UiAlert>
          </template>
          <UiForm v-else ref="emailFormRef" @submit="submitEmailChange">
            <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-4">
              {{ $t('profile.email.info') }}
            </p>
            <UiTextField
              v-model="emailForm.newEmail"
              :label="$t('profile.email.newEmail')"
              placeholder="yeni@ornek.com"
              density="comfortable"
              type="email"
              autocomplete="email"
              :rules="[validationRules.required, validationRules.email]"
              :disabled="sendingEmailChange"
              class="mb-2"
            />
            <UiTextField
              v-model="emailForm.currentPassword"
              :label="$t('profile.email.currentPassword')"
              placeholder="••••••••"
              density="comfortable"
              :type="showEmailPassword ? 'text' : 'password'"
              :append-inner-icon="showEmailPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autocomplete="current-password"
              :rules="[validationRules.required]"
              :disabled="sendingEmailChange"
              @click:append-inner="showEmailPassword = !showEmailPassword"
            />
            <UiAlert v-if="emailError" type="error" variant="tonal" density="compact" class="mt-2">
              {{ emailError }}
            </UiAlert>
          </UiForm>
        </div>
        <div class="dialog-actions">
          <template v-if="emailSentTo">
            <UiBtn class="btn-gradient-primary" @click="emailDialog = false">{{ $t('common.ok') }}</UiBtn>
          </template>
          <template v-else>
            <UiBtn variant="outlined" class="btn-gradient-dark" :disabled="sendingEmailChange" @click="emailDialog = false">{{ $t('common.cancel') }}</UiBtn>
            <UiBtn class="btn-gradient-primary" :loading="sendingEmailChange" @click="submitEmailChange">
              {{ $t('profile.email.submit') }}
            </UiBtn>
          </template>
        </div>
      </UiCard>
    </UiDialog>

    <ConfirmDialog
      v-model="confirmLogoutAll"
      :title="$t('profile.sessions.logoutAllTitle')"
      :message="$t('profile.sessions.logoutAllConfirm')"
      type="error"
      :confirm-text="$t('profile.sessions.logoutAllSubmit')"
      :loading="loggingOutAll"
      @confirm="doLogoutAll"
      @cancel="confirmLogoutAll = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { parseApiErrorMessages } from "~/utils/apiError";
import type { Session } from "~/types";
import { UserStatus } from "~/types";
import { dateFormat, dateTimeFormat } from "~/utils/datesFormat";
import BreadCrumb from "~/components/BreadCrumb.vue";
import { useValidators } from "~/composables/useValidators";
import { API_ENDPOINTS } from "~/utils/apiEndpoints";
import DeleteAccountSection from "~/components/Account/DeleteAccountSection.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";

definePageMeta({
  title: "Profilim",
  requiresAuth: true,
});

const { t } = useI18n();
useHead({ title: computed(() => t("profile.pageTitle")) });

const authStore = useAuthStore();
const {
  getUserSessions,
  changePassword,
  logoutAllDevices,
  updateProfile,
  requestEmailChange,
  sendPasswordChangeCode,
  changePasswordWithCode,
} = useAuth();
const { validationRules } = useValidators();
const toast = useToast();

// Bilgilerimi düzenle
const profileDialog = ref(false);
const profileFormRef = ref();
const savingProfile = ref(false);
const profileError = ref("");
const profileForm = reactive({ firstName: "", lastName: "", phoneNumber: "" });

const openProfileDialog = () => {
  profileForm.firstName = authStore.user?.firstName ?? "";
  profileForm.lastName = authStore.user?.lastName ?? "";
  profileForm.phoneNumber = authStore.user?.phoneNumber ?? "";
  profileError.value = "";
  profileDialog.value = true;
};

const saveProfile = async () => {
  const { valid } = await profileFormRef.value?.validate();
  if (!valid) return;
  savingProfile.value = true;
  profileError.value = "";
  try {
    await updateProfile({
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
      phoneNumber: profileForm.phoneNumber.trim() || undefined,
    });
    toast.success(t("profile.edit.success"));
    profileDialog.value = false;
  } catch (error) {
    profileError.value = parseApiErrorMessages(error)[0] || t("profile.edit.failed");
  } finally {
    savingProfile.value = false;
  }
};

// E-posta değiştir
const emailDialog = ref(false);
const emailFormRef = ref();
const sendingEmailChange = ref(false);
const showEmailPassword = ref(false);
const emailError = ref("");
const emailSentTo = ref("");
const emailForm = reactive({ newEmail: "", currentPassword: "" });

const openEmailDialog = () => {
  emailForm.newEmail = "";
  emailForm.currentPassword = "";
  emailError.value = "";
  emailSentTo.value = "";
  emailDialog.value = true;
};

const submitEmailChange = async () => {
  const { valid } = await emailFormRef.value?.validate();
  if (!valid) return;
  sendingEmailChange.value = true;
  emailError.value = "";
  try {
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    await requestEmailChange(newEmail, emailForm.currentPassword);
    emailSentTo.value = newEmail;
  } catch (error) {
    emailError.value = parseApiErrorMessages(error)[0] || t("auth.requestFailed");
  } finally {
    sendingEmailChange.value = false;
    emailForm.currentPassword = "";
  }
};

const user = computed(() => authStore.user);

// Kişisel veri indirme; sürerken düğme kilitli
const { download } = useDownload();
const exporting = ref(false);
const exportMyData = async () => {
  exporting.value = true;
  try {
    await download(API_ENDPOINTS.AUTH.ACCOUNT_EXPORT, "abacasa-hesabim.xlsx");
  } catch {
    toast.error(t("profile.data.exportFailed"));
  } finally {
    exporting.value = false;
  }
};

// Değerler backend UserStatus ile aynı (isim olarak gelir: Inactive, Active, Banned, PendingVerification)

const initials = computed(() => {
  const u = authStore.user;
  if (!u) return "?";
  return `${u.firstName?.charAt(0) ?? ""}${u.lastName?.charAt(0) ?? ""}`.toUpperCase();
});

const statusColor = computed(() => {
  switch (authStore.user?.status) {
    case UserStatus.Active:
      return "success";
    case UserStatus.Inactive:
      return "warning";
    case UserStatus.Banned:
      return "error";
    case UserStatus.PendingVerification:
      return "info";
    default:
      return "grey";
  }
});

const statusLabel = computed(() => {
  switch (authStore.user?.status) {
    case UserStatus.Active:
      return t("common.active");
    case UserStatus.Inactive:
      return t("common.inactive");
    case UserStatus.Banned:
      return t("profile.status.banned");
    case UserStatus.PendingVerification:
      return t("profile.status.pendingVerification");
    default:
      return t("profile.status.unknown");
  }
});

const memberDays = computed(() => {
  const d = authStore.user?.createdDate;
  if (!d) return "—";
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
});

const lastLoginShort = computed(() => {
  const d = authStore.user?.lastLoginDate;
  if (!d) return "—";
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return t("profile.today");
  const diff = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 1) return t("profile.yesterday");
  if (diff < 7) return t("profile.daysAgo", { n: diff });
  return dateFormat(d);
});

// Sessions
const sessions = ref<Session[]>([]);
const loadingSessions = ref(false);
const showHistory = ref(false);

// Tabs
const tabDefs = [
  { key: "profile", labelKey: "profile.tabs.profile", icon: "mdi-account-circle-outline" },
  { key: "security", labelKey: "profile.tabs.security", icon: "mdi-shield-lock-outline" },
] as const;
const tabs = computed(() => tabDefs.map((tab) => ({ ...tab, label: t(tab.labelKey) })));
const activeTab = ref<(typeof tabDefs)[number]["key"]>("profile");

const activeSessions = computed(() =>
  sessions.value.filter((s: Session) => s.isActive),
);
const inactiveSessions = computed(() =>
  sessions.value.filter((s: Session) => !s.isActive),
);

const loggingOutAll = ref(false);
const confirmLogoutAll = ref(false);

// Backend tüm refresh token'ları iptal eder; useAuth ana sayfaya yönlendirir
const doLogoutAll = async () => {
  loggingOutAll.value = true;
  try {
    await logoutAllDevices();
  } finally {
    loggingOutAll.value = false;
    confirmLogoutAll.value = false;
  }
};

const loadSessions = async () => {
  loadingSessions.value = true;
  try {
    sessions.value = await getUserSessions();
  } catch {
    sessions.value = [];
  } finally {
    loadingSessions.value = false;
  }
};

const deviceIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "mobile":
      return "mdi-cellphone";
    case "tablet":
      return "mdi-tablet";
    default:
      return "mdi-monitor";
  }
};

const formatDate = (iso: string) => dateTimeFormat(iso);

const remainingLabel = (session: Session) => {
  const raw = session.remainingTime?.toString() ?? "";
  if (!raw || raw.startsWith("-")) return "—";
  let days = 0;
  let timePart = raw;
  if (raw.includes(".")) {
    const dot = raw.indexOf(".");
    days = parseInt(raw.slice(0, dot) ?? "0");
    timePart = raw.slice(dot + 1);
  }
  const [h, m] = timePart.split(":").map(Number);
  if (days >= 1) return t("profile.duration.days", { n: days });
  if (h >= 1) return t("profile.duration.hours", { n: h });
  if (m >= 1) return t("profile.duration.minutes", { n: m });
  return t("profile.duration.lessThanMinute");
};

// Change password
const passwordFormRef = ref();
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const isChangingPassword = ref(false);

// Mevcut şifre yerine e-posta kodu (backend: password-change/code + /confirm)
const useCode = ref(false);
const passwordCode = ref("");
const sendingCode = ref(false);
const codeSent = ref(false);
const codeCooldown = ref(0);
let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const startCooldown = (seconds: number) => {
  codeCooldown.value = seconds;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    codeCooldown.value = Math.max(0, codeCooldown.value - 1);
    if (codeCooldown.value === 0 && cooldownTimer) clearInterval(cooldownTimer);
  }, 1000);
};

const switchToCode = () => {
  useCode.value = true;
  currentPassword.value = "";
};

const sendCode = async () => {
  sendingCode.value = true;
  try {
    await sendPasswordChangeCode();
    codeSent.value = true;
    toast.success(t("auth.codeSent"));
    startCooldown(60);
  } catch (error) {
    const message = parseApiErrorMessages(error)[0] || t("auth.codeSendFailed");
    toast.error(message);
    // Backend bekleme süresini mesajda bildirir ("... 42 saniye bekleyin")
    const seconds = Number(message.match(/\d+/)?.[0]);
    if (seconds > 0) startCooldown(seconds);
  } finally {
    sendingCode.value = false;
  }
};

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
});

const submitChangePassword = async () => {
  const { valid } = await passwordFormRef.value.validate();
  if (!valid) return;
  isChangingPassword.value = true;
  try {
    if (useCode.value) {
      // Başarıda backend tüm oturumları kapatır; useAuth login sayfasına yönlendirir
      await changePasswordWithCode(passwordCode.value.trim(), newPassword.value);
      return;
    }
    await changePassword(currentPassword.value, newPassword.value);
    passwordFormRef.value.reset();
    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
  } finally {
    isChangingPassword.value = false;
  }
};

onMounted(loadSessions);
</script>

<style scoped>
.profile-page {
  --pf-brand: rgb(var(--color-brand));
  --pf-surface: rgb(var(--color-surface-container-lowest));
  --pf-surface-muted: rgb(var(--color-surface-container-low));
  --pf-border: rgb(var(--color-outline-variant) / 0.6);
  --pf-text: rgb(var(--color-on-surface));
  --pf-text-muted: rgb(var(--color-on-surface-variant));
  /* Yazı/ikon vurgusu (koyu temada marka rengi zaten açık tondur, bkz. plugins/brand.client.ts) */
  --pf-accent: var(--pf-brand);
  max-width: 1080px;
  padding: 24px;
}

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
.page-hero {
  border: 1px solid var(--pf-border);
  border-radius: 20px;
  margin-bottom: 18px;
  background: var(--pf-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* Marka renginin hafif tonundan karta eriyen kapak */
.hero-banner {
  height: 64px;
  position: relative;
  overflow: hidden;
  border-radius: 19px 19px 0 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--pf-brand) 12%, var(--pf-surface)) 0%,
    color-mix(in srgb, var(--pf-brand) 4%, var(--pf-surface)) 55%,
    var(--pf-surface) 100%
  );
}

.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(85% 130% at 85% -25%, color-mix(in srgb, var(--pf-brand) 16%, transparent) 0%, transparent 60%),
    radial-gradient(65% 110% at 12% -30%, color-mix(in srgb, var(--pf-brand) 10%, transparent) 0%, transparent 55%);
  pointer-events: none;
}

.hero-status {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 1;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-success { background: rgba(34, 197, 94, 0.12); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.25); }
.status-warning { background: rgba(245, 158, 11, 0.12); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.25); }
.status-error { background: rgba(239, 68, 68, 0.1); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25); }
.status-info { background: rgba(59, 130, 246, 0.1); color: #1d4ed8; border: 1px solid rgba(59, 130, 246, 0.25); }
.status-grey { background: var(--pf-surface-muted); color: var(--pf-text-muted); border: 1px solid var(--pf-border); }

.hero-body {
  padding: 0 24px 16px;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
  margin-top: -36px; /* avatar kapak sınırının üstüne taşar */
}

.profile-avatar :deep(.user-avatar) {
  border: 3px solid var(--pf-surface) !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06) !important;
}

/* Kamera sol altta, kaldır sağ üstte; sağ alt köşe çevrimiçi noktasının */
.profile-avatar :deep(.photo-editor__btn) {
  width: 26px;
  height: 26px;
  border-color: var(--pf-surface);
}
.profile-avatar :deep(.photo-editor__btn svg) {
  width: 14px;
  height: 14px;
}
.profile-avatar :deep(.photo-editor__btn--upload) {
  left: -2px;
  right: auto;
  background: var(--pf-brand);
}
.profile-avatar :deep(.photo-editor__btn--remove) {
  left: auto;
  right: -4px;
  top: -2px;
  bottom: auto;
}

.online-dot {
  position: absolute;
  bottom: 4px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 2px solid var(--pf-surface);
  border-radius: 50%;
}

.hero-meta {
  padding-bottom: 2px;
  min-width: 0;
}

.hero-name {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--pf-text);
  margin: 0 0 4px;
  line-height: 1.2;
}

.hero-email {
  font-size: 0.8rem;
  color: var(--pf-text-muted);
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-strip {
  display: flex;
  border-top: 1px solid var(--pf-border);
  background: var(--pf-surface-muted);
  border-radius: 0 0 20px 20px;
}

.stat-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
}

.stat-sep {
  width: 1px;
  background: var(--pf-border);
}

.stat-icon {
  color: var(--pf-accent);
}

.stat-val {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--pf-text);
  line-height: 1;
}

.stat-lbl {
  font-size: 0.67rem;
  color: var(--pf-text-muted);
  margin-top: 2px;
}

/* ══════════════════════════════════════════
   TABS
══════════════════════════════════════════ */
.profile-tabs {
  position: sticky;
  top: 12px;
  z-index: 10;
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  padding: 6px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.profile-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--pf-text-muted);
  background: transparent;
  font-family: inherit;
  transition: all 0.15s;
}

.profile-tab:hover {
  background: var(--pf-surface-muted);
  color: var(--pf-accent);
}

.profile-tab--active {
  background: color-mix(in srgb, var(--pf-brand) 8%, var(--pf-surface));
  border-color: color-mix(in srgb, var(--pf-brand) 16%, transparent);
  color: var(--pf-accent);
}

.tab-content {
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

/* ══════════════════════════════════════════
   CARD
══════════════════════════════════════════ */
.card {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.security-card {
  max-width: 520px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--pf-text);
  flex-wrap: wrap;
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--pf-brand) 10%, transparent);
  color: var(--pf-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-divider {
  height: 1px;
  background: var(--pf-border);
  opacity: 0.6;
}

.count-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--pf-brand) 10%, transparent);
  color: var(--pf-accent);
}

.edit-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px solid var(--pf-border);
  background: var(--pf-surface);
  color: var(--pf-accent);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.edit-btn:hover {
  border-color: var(--pf-accent);
  background: color-mix(in srgb, var(--pf-brand) 4%, transparent);
}

/* ══════════════════════════════════════════
   INFO GRID
══════════════════════════════════════════ */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 16px;
}

.info-tile {
  background: var(--pf-surface-muted);
  border: 1px solid color-mix(in srgb, var(--pf-border) 60%, transparent);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.15s;
}

.info-tile:hover {
  border-color: color-mix(in srgb, var(--pf-brand) 25%, transparent);
}

.info-tile--wide {
  grid-column: span 2;
}

.tile-lbl {
  font-size: 0.67rem;
  color: var(--pf-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.tile-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--pf-text);
  word-break: break-all;
}

.tile-val--sm { font-size: 0.8rem; }
.tile-val--muted { color: var(--pf-text-muted); font-weight: 400; }

.tile-val-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.confirm-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 600;
}
.confirm-ok { background: rgba(34, 197, 94, 0.1); color: #15803d; }
.confirm-warn { background: rgba(245, 158, 11, 0.1); color: #b45309; }

/* Altı çizili link yerine küçük hap buton — tıklanabilir olduğu belli olsun */
.link-inline-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--pf-brand) 22%, transparent);
  background: color-mix(in srgb, var(--pf-brand) 8%, transparent);
  color: var(--pf-accent);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  padding: 4px 10px;
  border-radius: 999px;
  transition: background 0.15s, border-color 0.15s;
}

.link-inline-btn:hover {
  background: color-mix(in srgb, var(--pf-brand) 14%, transparent);
  border-color: color-mix(in srgb, var(--pf-brand) 32%, transparent);
}

/* ══════════════════════════════════════════
   PASSWORD
══════════════════════════════════════════ */
.pwd-mode-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 16px 0;
}

.pwd-mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1.5px solid var(--pf-border);
  background: var(--pf-surface-muted);
  color: var(--pf-text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.pwd-mode-btn.active {
  border-color: var(--pf-accent);
  background: color-mix(in srgb, var(--pf-brand) 6%, transparent);
  color: var(--pf-accent);
}

.code-btn {
  flex-shrink: 0;
}

/* ══════════════════════════════════════════
   SESSIONS
══════════════════════════════════════════ */
.session-list {
  padding: 12px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-list--history {
  padding: 0;
}

.session-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--pf-border) 60%, transparent);
  background: var(--pf-surface-muted);
  transition: border-color 0.15s;
}

.session-card:hover {
  border-color: color-mix(in srgb, var(--pf-brand) 20%, transparent);
}

.session-card--current {
  background: color-mix(in srgb, var(--pf-brand) 4%, var(--pf-surface));
  border-color: color-mix(in srgb, var(--pf-brand) 20%, transparent);
}

.session-card--inactive {
  opacity: 0.6;
}

.session-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  color: var(--pf-text-muted);
}

.session-icon--current {
  background: color-mix(in srgb, var(--pf-brand) 10%, transparent);
  border-color: transparent;
  color: var(--pf-accent);
}

.session-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--pf-text);
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  color: var(--pf-text-muted);
  flex-wrap: wrap;
}

/* Kalan süre marka renginde (aşama 4'teki gibi) */
.session-remaining { color: var(--pf-accent); font-weight: 500; }
.session-ended { color: rgb(var(--color-error)); }

.history-wrap {
  padding: 0 16px 16px;
}

.history-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid color-mix(in srgb, var(--pf-border) 60%, transparent);
  font-size: 0.75rem;
  color: var(--pf-text-muted);
  cursor: pointer;
  user-select: none;
}

/* Güvenlik sekmesindeki alt grup başlığı */
.group-title {
  margin: 24px 0 10px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pf-text-muted);
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px;
  color: var(--pf-text-muted);
  font-size: 0.85rem;
}

.min-w-0 { min-width: 0; }
.flex-1 { flex: 1; }

@media (max-width: 700px) {
  .profile-page { padding: 12px; }
  .stat-pill { padding: 10px 12px; gap: 6px; }
  .info-grid { grid-template-columns: 1fr; }
  .info-tile--wide { grid-column: span 1; }
}
</style>

<style>
/* Koyu tema: scoped stilde :global(.dark) .x seçicisinin ikinci kısmı düşüyor, bu yüzden burada */
.dark .profile-page .status-success,
.dark .profile-page .confirm-ok { color: #4ade80; }
.dark .profile-page .status-warning,
.dark .profile-page .confirm-warn { color: #fbbf24; }
.dark .profile-page .status-error { color: #f87171; }
.dark .profile-page .status-info { color: #93c5fd; }
</style>

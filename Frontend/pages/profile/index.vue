<template>
  <div class="profile-page">
    <div class="mb-6">
      <BreadCrumb
        :items="[{ text: 'Ana Sayfa', to: '/dashboard' }, { text: 'Profilim' }]"
      />
    </div>

    <!-- ═══════════════ HERO ═══════════════ -->
    <UiCard class="hero-card mb-6" rounded="xl" elevation="0" border>
      <!-- Gradient banner with decorative blobs -->
      <div class="hero-banner">
        <div class="blob blob-1" />
        <div class="blob blob-2" />
        <div class="blob blob-3" />
      </div>

      <div class="ui-card-text hero-body !pt-0 !px-6 !pb-0">
        <div class="hero-top">
          <!-- Avatar -->
          <div class="avatar-wrap">
            <ProfilePhotoEditor
              :url="user?.profileImageUrl"
              :initials="initials"
              :size="108"
              class="profile-avatar"
            />
            <span class="online-dot" />
          </div>

          <!-- Name & email -->
          <div class="hero-meta">
            <h1 class="profile-name">{{ user?.fullName }}</h1>
            <p class="profile-email !mt-1">
              <UiIcon icon="mdi-email-outline" :size="13" class="me-1" />
              {{ user?.email }}
            </p>
          </div>

          <!-- Status chip -->
          <UiChip
            class="hero-status ml-auto"
            :color="statusColor"
            variant="tonal"
            size="small"
            :prepend-icon="
              statusColor === 'success'
                ? 'mdi-check-circle-outline'
                : 'mdi-alert-circle-outline'
            "
          >
            {{ statusLabel }}
          </UiChip>
        </div>
      </div>

      <!-- Stats strip -->
      <div class="stats-strip">
        <div class="stat-pill">
          <UiIcon icon="mdi-monitor-multiple" :size="16" color="primary" />
          <div>
            <div class="stat-val">
              {{ loadingSessions ? "—" : activeSessions.length }}
            </div>
            <div class="stat-lbl">Aktif Oturum</div>
          </div>
        </div>
        <div class="stat-sep" />
        <div class="stat-pill">
          <UiIcon icon="mdi-calendar-account-outline" :size="16" color="primary" />
          <div>
            <div class="stat-val">{{ memberDays }}</div>
            <div class="stat-lbl">Gün Üye</div>
          </div>
        </div>
        <div class="stat-sep" />
        <div class="stat-pill">
          <UiIcon icon="mdi-login-variant" :size="16" color="primary" />
          <div>
            <div class="stat-val">
              {{ user?.lastLoginDate ? lastLoginShort : "—" }}
            </div>
            <div class="stat-lbl">Son Giriş</div>
          </div>
        </div>
      </div>
    </UiCard>

    <!-- ═══════════════ MAIN ═══════════════ -->
    <div class="ui-row">
      <!-- ── Left: Account Info ── -->
      <div class="ui-col ui-col-12 ui-col-md-4">
        <UiCard rounded="xl" elevation="0" border height="100%">
          <div class="ui-card-title section-title !p-5">
            <UiAvatar
              color="primary"
              variant="tonal"
              :size="32"
              rounded="lg"
              class="mr-3"
            >
              <UiIcon icon="mdi-account-circle-outline" :size="16" />
            </UiAvatar>
            Hesap Bilgileri
            <div class="flex-1" />
            <UiBtn
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-pencil-outline"
              @click="openProfileDialog"
            >
              Düzenle
            </UiBtn>
          </div>
          <hr class="ui-divider" />

          <div class="ui-card-text !p-4">
            <div class="info-grid">
              <div class="info-tile">
                <span class="tile-lbl">Ad</span>
                <span class="tile-val">{{ user?.firstName || "—" }}</span>
              </div>

              <div class="info-tile">
                <span class="tile-lbl">Soyad</span>
                <span class="tile-val">{{ user?.lastName || "—" }}</span>
              </div>

              <div class="info-tile info-tile--wide">
                <span class="tile-lbl">E-posta</span>
                <div class="flex items-center gap-1">
                  <span class="tile-val">{{ user?.email }}</span>
                  <UiTooltip
                    :text="user?.emailConfirmed ? 'Doğrulandı' : 'Doğrulanmadı'"
                    location="top"
                  >
                    <UiIcon
                      :icon="user?.emailConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle-outline'"
                      :size="14"
                      :color="user?.emailConfirmed ? 'success' : 'warning'"
                    />
                  </UiTooltip>
                  <UiBtn
                    size="x-small"
                    variant="text"
                    color="primary"
                    class="ml-auto"
                    @click="openEmailDialog"
                  >
                    Değiştir
                  </UiBtn>
                </div>
              </div>

              <div v-if="user?.phoneNumber" class="info-tile info-tile--wide">
                <span class="tile-lbl">Telefon</span>
                <div class="flex items-center gap-1">
                  <span class="tile-val">{{ user.phoneNumber }}</span>
                  <UiTooltip
                    :text="user?.phoneConfirmed ? 'Doğrulandı' : 'Doğrulanmadı'"
                    location="top"
                  >
                    <UiIcon
                      :icon="user?.phoneConfirmed ? 'mdi-check-circle' : 'mdi-alert-circle-outline'"
                      :size="14"
                      :color="user?.phoneConfirmed ? 'success' : 'warning'"
                    />
                  </UiTooltip>
                </div>
              </div>

              <div class="info-tile">
                <span class="tile-lbl">Kayıt Tarihi</span>
                <span class="tile-val">{{
                  user?.createdDate ? dateFormat(user.createdDate) : "—"
                }}</span>
              </div>

              <div class="info-tile">
                <span class="tile-lbl">Son Giriş</span>
                <span class="tile-val tile-val--sm">{{
                  user?.lastLoginDate ? dateTimeFormat(user.lastLoginDate) : "—"
                }}</span>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- ── Right: Sessions ── -->
      <div class="ui-col ui-col-12 ui-col-md-8">
        <UiCard rounded="xl" elevation="0" border>
          <div class="ui-card-title section-title !p-5">
            <UiAvatar
              color="primary"
              variant="tonal"
              :size="32"
              rounded="lg"
              class="mr-3"
            >
              <UiIcon icon="mdi-monitor-multiple" :size="16" />
            </UiAvatar>
            <span>Oturumlarım</span>
            <UiChip
              v-if="!loadingSessions && activeSessions.length"
              size="x-small"
              color="primary"
              variant="tonal"
              class="ml-2"
            >
              {{ activeSessions.length }} aktif
            </UiChip>
            <div class="flex-1" />
            <UiBtn
              size="small"
              variant="text"
              color="primary"
              prepend-icon="mdi-refresh"
              :loading="loadingSessions"
              @click="loadSessions"
            >
              Yenile
            </UiBtn>
            <UiBtn
              v-if="activeSessions.length"
              size="small"
              variant="tonal"
              color="error"
              prepend-icon="mdi-logout-variant"
              class="ml-2"
              :loading="loggingOutAll"
              @click="confirmLogoutAll = true"
            >
              Tümünden Çık
            </UiBtn>
          </div>
          <hr class="ui-divider" />

          <div class="ui-card-text !p-0">
            <UiProgressLinear
              v-if="loadingSessions"
              indeterminate
              color="primary"
            />

            <!-- Empty -->
            <div
              v-if="!loadingSessions && !sessions.length"
              class="empty-state p-10"
            >
              <UiAvatar color="grey-lighten-3" :size="64" class="mb-4">
                <UiIcon icon="mdi-monitor-off" :size="30" color="grey" />
              </UiAvatar>
              <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70">
                Aktif oturum bulunamadı.
              </p>
            </div>

            <!-- Active sessions -->
            <div
              v-if="!loadingSessions && activeSessions.length"
              class="p-4 flex flex-col gap-2"
            >
              <div
                v-for="session in activeSessions"
                :key="session.id"
                class="session-card"
                :class="{ 'session-card--current': session.isCurrentSession }"
              >
                <div
                  class="session-accent"
                  :class="{
                    'session-accent--current': session.isCurrentSession,
                  }"
                />

                <UiAvatar
                  :color="session.isCurrentSession ? 'primary' : 'grey'"
                  variant="tonal"
                  :size="44"
                  rounded="lg"
                  class="flex-shrink-0"
                >
                  <UiIcon :icon="deviceIcon(session.deviceType)" :size="22" />
                </UiAvatar>

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
                      Bu cihaz
                    </UiChip>
                    <UiChip
                      size="x-small"
                      color="success"
                      variant="tonal"
                      rounded
                    >
                      <UiIcon icon="mdi-circle" start :size="9" />
                      Aktif
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
                    <span class="text-primary font-medium">
                      <UiIcon icon="mdi-clock-outline" :size="11" color="success" />
                      {{ remainingLabel(session) }} kaldı
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Inactive (collapsible) -->
            <div
              v-if="!loadingSessions && inactiveSessions.length"
              class="px-4 pb-4"
            >
              <hr class="ui-divider !mb-3" />
              <div
                class="history-toggle flex items-center gap-2 mb-3"
                @click="showHistory = !showHistory"
              >
                <UiIcon :icon="showHistory ? 'mdi-chevron-up' : 'mdi-chevron-down'" :size="16" color="grey" />
                <span class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">
                  Geçmiş oturumlar ({{ inactiveSessions.length }})
                </span>
              </div>

              <div v-if="showHistory" class="flex flex-col gap-2">
                <div
                  v-for="session in inactiveSessions"
                  :key="session.id"
                  class="session-card session-card--inactive"
                >
                  <div class="session-accent session-accent--error" />
                  <UiAvatar
                    color="grey"
                    variant="tonal"
                    :size="44"
                    rounded="lg"
                    class="flex-shrink-0"
                  >
                    <UiIcon :icon="deviceIcon(session.deviceType)" :size="22" color="grey" />
                  </UiAvatar>
                  <div class="flex-1 min-w-0">
                    <span class="session-name !text-black/60 dark:!text-white/70">{{
                      session.deviceName
                    }}</span>
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
                      <span class="text-error">Sona erdi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- ═══════════════ CHANGE PASSWORD ═══════════════ -->
    <div class="ui-row !mt-0">
      <div class="ui-col ui-col-12 ui-col-md-6">
        <UiCard rounded="xl" elevation="0" border>
          <div class="ui-card-title section-title !p-5">
            <UiAvatar
              color="primary"
              variant="tonal"
              :size="32"
              rounded="lg"
              class="mr-3"
            >
              <UiIcon icon="mdi-lock-reset" :size="16" />
            </UiAvatar>
            Şifre Değiştir
          </div>
          <hr class="ui-divider" />

          <div class="ui-card-text !p-5">
            <UiForm
              ref="passwordFormRef"
              @submit="submitChangePassword"
            >
              <template v-if="!useCode">
                <UiTextField
                  v-model="currentPassword"
                  label="Mevcut Şifre"
                  :type="showCurrent ? 'text' : 'password'"
                  :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                  :rules="[validationRules.required]"
                  density="comfortable"
                  class="mb-1"
                  @click:append-inner="showCurrent = !showCurrent"
                />
                <div class="flex justify-end mb-3">
                  <UiBtn size="small" variant="text" color="primary" @click="switchToCode">
                    Mevcut şifremi hatırlamıyorum
                  </UiBtn>
                </div>
              </template>

              <!-- Mevcut şifre yerine e-postaya gelen 6 haneli kod -->
              <template v-else>
                <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-3">
                  <strong>{{ user?.email }}</strong> adresine 6 haneli bir kod gönderilir. Kod 10 dakika geçerlidir.
                </p>
                <div class="flex gap-2 items-start mb-1">
                  <UiTextField
                    v-model="passwordCode"
                    label="Doğrulama Kodu"
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
                    class="mt-[23px]"
                    style="height: 48px"
                    :loading="sendingCode"
                    :disabled="codeCooldown > 0"
                    @click="sendCode"
                  >
                    {{ codeCooldown > 0 ? `${codeCooldown} sn` : codeSent ? "Tekrar Gönder" : "Kod Gönder" }}
                  </UiBtn>
                </div>
                <div class="flex justify-end mb-3">
                  <UiBtn size="small" variant="text" @click="useCode = false">Mevcut şifremle değiştir</UiBtn>
                </div>
              </template>
              <UiTextField
                v-model="newPassword"
                label="Yeni Şifre"
                :type="showNew ? 'text' : 'password'"
                :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
                :rules="[validationRules.password]"
                density="comfortable"
                class="mb-3"
                @click:append-inner="showNew = !showNew"
              />
              <UiTextField
                v-model="confirmNewPassword"
                label="Yeni Şifre Tekrar"
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
                Şifreyi Güncelle
              </UiBtn>
            </UiForm>
          </div>
        </UiCard>
      </div>
    </div>

    <!-- ═══════════════ VERİLERİM / DELETE ACCOUNT ═══════════════ -->
    <div class="ui-row !mt-0">
      <div class="ui-col ui-col-12 ui-col-md-6">
        <UiCard rounded="xl" elevation="0" border class="mb-6">
          <div class="ui-card-title section-title !p-5">
            <UiAvatar color="primary" variant="tonal" :size="32" rounded="lg" class="mr-3">
              <UiIcon icon="mdi-microsoft-excel" :size="16" />
            </UiAvatar>
            Verilerim
          </div>
          <hr class="ui-divider" />
          <div class="ui-card-text !p-5">
            <p class="mb-4">Hesap bilgileriniz, üyelikleriniz, onaylarınız, oturumlarınız ve giriş denemeleriniz Excel dosyası olarak.</p>
            <UiBtn color="primary" variant="tonal" prepend-icon="mdi-download" :loading="exporting" :disabled="exporting" @click="exportMyData">
              Verilerimi indir (Excel)
            </UiBtn>
          </div>
        </UiCard>
        <DeleteAccountSection />
      </div>
    </div>

    <!-- Bilgilerimi düzenle -->
    <UiDialog v-model="profileDialog" max-width="460">
      <UiCard rounded="xl">
        <div class="ui-card-title !pt-5 !px-5">Bilgilerimi Düzenle</div>
        <div class="ui-card-text !px-5">
          <UiForm ref="profileFormRef" @submit="saveProfile">
            <UiTextField
              v-model="profileForm.firstName"
              label="Ad"
              density="comfortable"
              :rules="[validationRules.required]"
              :disabled="savingProfile"
              class="mb-2"
            />
            <UiTextField
              v-model="profileForm.lastName"
              label="Soyad"
              density="comfortable"
              :rules="[validationRules.required]"
              :disabled="savingProfile"
              class="mb-2"
            />
            <UiTextField
              v-model="profileForm.phoneNumber"
              label="Telefon"
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
        <div class="ui-card-actions !px-5 !pb-5">
          <div class="flex-1" />
          <UiBtn variant="text" :disabled="savingProfile" @click="profileDialog = false">İptal</UiBtn>
          <UiBtn color="primary" variant="flat" :loading="savingProfile" @click="saveProfile">Kaydet</UiBtn>
        </div>
      </UiCard>
    </UiDialog>

    <!-- E-posta değiştir: değişiklik yeni adrese giden link onaylanınca uygulanır -->
    <UiDialog v-model="emailDialog" max-width="460">
      <UiCard rounded="xl">
        <div class="ui-card-title !pt-5 !px-5">E-posta Adresini Değiştir</div>
        <div class="ui-card-text !px-5">
          <template v-if="emailSentTo">
            <UiAlert type="success" variant="tonal" class="mb-2">
              <strong>{{ emailSentTo }}</strong> adresine bir onay bağlantısı gönderdik. Bağlantıya
              tıklayana kadar mevcut adresinizle giriş yapmaya devam edersiniz.
            </UiAlert>
          </template>
          <UiForm v-else ref="emailFormRef" @submit="submitEmailChange">
            <p class="text-[0.875rem] leading-[1.425] tracking-[0.0178571429em] font-normal text-black/60 dark:text-white/70 mb-4">
              Yeni adrese bir onay bağlantısı gönderilir. E-postanız bu bağlantı onaylandığında değişir
              ve tüm oturumlarınız kapatılır.
            </p>
            <UiTextField
              v-model="emailForm.newEmail"
              label="Yeni e-posta"
              density="comfortable"
              type="email"
              autocomplete="email"
              :rules="[validationRules.required, validationRules.email]"
              :disabled="sendingEmailChange"
              class="mb-2"
            />
            <UiTextField
              v-model="emailForm.currentPassword"
              label="Mevcut şifre"
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
        <div class="ui-card-actions !px-5 !pb-5">
          <div class="flex-1" />
          <template v-if="emailSentTo">
            <UiBtn color="primary" variant="flat" @click="emailDialog = false">Tamam</UiBtn>
          </template>
          <template v-else>
            <UiBtn variant="text" :disabled="sendingEmailChange" @click="emailDialog = false">İptal</UiBtn>
            <UiBtn color="primary" variant="flat" :loading="sendingEmailChange" @click="submitEmailChange">
              Onay Bağlantısı Gönder
            </UiBtn>
          </template>
        </div>
      </UiCard>
    </UiDialog>

    <ConfirmDialog
      v-model="confirmLogoutAll"
      title="Tüm cihazlardan çıkış"
      message="Tüm cihazlardaki oturumlarınız kapatılacak, bu cihaz dahil. Devam etmek istiyor musunuz?"
      type="error"
      confirm-text="Evet, çıkış yap"
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
import { API_ENDPOINTS } from "~/utils/apiEndpoints";
import { dateFormat, dateTimeFormat } from "~/utils/datesFormat";
import BreadCrumb from "~/components/BreadCrumb.vue";
import DeleteAccountSection from "~/components/Account/DeleteAccountSection.vue";
import ConfirmDialog from "~/components/UI/ConfirmDialog.vue";
import { useValidators } from "~/composables/useValidators";

definePageMeta({
  title: "Profilim",
  requiresAuth: true,
});

useHead({ title: "Profilim - Abacasa" });

const authStore = useAuthStore();
const {
  getUserSessions,
  changePassword,
  updateProfile,
  requestEmailChange,
  sendPasswordChangeCode,
  changePasswordWithCode,
  logoutAllDevices,
} = useAuth();
const { validationRules } = useValidators();

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
    toast.success("Bilgileriniz güncellendi.");
    profileDialog.value = false;
  } catch (error) {
    profileError.value = parseApiErrorMessages(error)[0] || "Bilgiler güncellenemedi.";
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
    emailError.value = parseApiErrorMessages(error)[0] || "İstek gönderilemedi.";
  } finally {
    sendingEmailChange.value = false;
    emailForm.currentPassword = "";
  }
};

const user = computed(() => authStore.user);

const initials = computed(() => {
  const u = authStore.user;
  if (!u) return "?";
  return `${u.firstName?.charAt(0) ?? ""}${u.lastName?.charAt(0) ?? ""}`.toUpperCase();
});

// Kişisel veri indirme; sürerken düğme kilitli
const { download } = useDownload();
const toast = useToast();
const exporting = ref(false);
const exportMyData = async () => {
  exporting.value = true;
  try {
    await download(API_ENDPOINTS.AUTH.ACCOUNT_EXPORT, "abacasa-hesabim.xlsx");
  } catch {
    toast.error("Veriler indirilemedi");
  } finally {
    exporting.value = false;
  }
};

// Değerler backend UserStatus ile aynı (isim olarak gelir: Inactive, Active, Banned, PendingVerification)
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
      return "Aktif";
    case UserStatus.Inactive:
      return "Pasif";
    case UserStatus.Banned:
      return "Yasaklı";
    case UserStatus.PendingVerification:
      return "Doğrulama bekliyor";
    default:
      return "Bilinmiyor";
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
  if (date.toDateString() === today.toDateString()) return "Bugün";
  const diff = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (diff === 1) return "Dün";
  if (diff < 7) return `${diff} gün önce`;
  return dateFormat(d);
});

// Sessions
const sessions = ref<Session[]>([]);
const loadingSessions = ref(false);
const showHistory = ref(false);

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
  if (days >= 1) return `${days} gün`;
  if (h >= 1) return `${h} saat`;
  if (m >= 1) return `${m} dakika`;
  return "< 1 dakika";
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
    toast.success("Doğrulama kodu e-posta adresinize gönderildi.");
    startCooldown(60);
  } catch (error) {
    const message = parseApiErrorMessages(error)[0] || "Kod gönderilemedi.";
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
  max-width: 1080px;
  padding: 24px;
}

/* ══════════════════════════════════════════
   HERO
══════════════════════════════════════════ */
.hero-card {
  overflow: visible;
}

.hero-banner {
  height: 140px;
  border-radius: 12px 12px 0 0;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #a855f7 100%);
  position: relative;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.18;
  filter: blur(2px);
  background: white;
}
.blob-1 {
  width: 160px;
  height: 160px;
  top: -60px;
  left: -40px;
}
.blob-2 {
  width: 100px;
  height: 100px;
  top: 20px;
  right: 80px;
  opacity: 0.12;
}
.blob-3 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  right: -60px;
  opacity: 0.08;
}

.hero-body {
  overflow: visible;
}

.hero-top {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  margin-top: -54px;
  flex-wrap: wrap;
  padding-bottom: 16px;
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar :deep(.user-avatar) {
  border: 4px solid white !important;
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3) !important;
}

.avatar-initials {
  font-size: 2.2rem;
  font-weight: 800;
  color: white;
  letter-spacing: -1px;
}

.online-dot {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
}

.hero-meta {
  padding-bottom: 4px;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.15;
  letter-spacing: -0.4px;
}

.profile-email {
  font-size: 0.82rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  margin: 0;
}

.hero-status {
  margin-bottom: 4px;
}

/* Stats strip */
.stats-strip {
  display: flex;
  align-items: center;
  gap: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  background: #fafafa;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
}

.stat-pill {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
}

.stat-sep {
  width: 1px;
  height: 36px;
  background: rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.stat-val {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-lbl {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 2px;
}

/* ══════════════════════════════════════════
   SECTION TITLES
══════════════════════════════════════════ */
.section-title {
  font-size: 0.88rem !important;
  font-weight: 700 !important;
  color: #111827 !important;
  display: flex;
  align-items: center;
}

/* ══════════════════════════════════════════
   INFO GRID
══════════════════════════════════════════ */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.info-tile {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color 0.15s;
}

.info-tile:hover {
  border-color: rgba(79, 70, 229, 0.25);
}

.info-tile--wide {
  grid-column: span 2;
}

.tile-lbl {
  font-size: 0.68rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.tile-val {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  word-break: break-all;
}

.tile-val--sm {
  font-size: 0.8rem;
}

/* ══════════════════════════════════════════
   SESSION CARDS
══════════════════════════════════════════ */
.session-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  background: #fafafa;
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.session-card:hover {
  border-color: rgba(79, 70, 229, 0.2);
  box-shadow: 0 2px 10px rgba(79, 70, 229, 0.06);
}

.session-card--current {
  background: rgba(79, 70, 229, 0.03);
  border-color: rgba(79, 70, 229, 0.2);
}

.session-card--inactive {
  opacity: 0.6;
}

.session-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #e5e7eb;
  border-radius: 3px 0 0 3px;
}

.session-accent--current {
  background: #4f46e5;
}
.session-accent--error {
  background: #ef4444;
}

.session-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.45);
  flex-wrap: wrap;
}

.history-toggle {
  cursor: pointer;
  user-select: none;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
}

.min-w-0 {
  min-width: 0;
}
.flex-1 {
  flex: 1;
}
</style>

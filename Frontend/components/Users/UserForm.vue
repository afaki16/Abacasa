<template>
  <!-- Modern Tab Navigation -->
  <div class="tabs-container modern-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="['tab-item', { active: currentTab === tab.value }]"
      @click="currentTab = tab.value"
      :disabled="loading"
    >
      <div class="tab-icon-wrapper">
        <UiIcon :icon="tab.icon" :size="22" />
      </div>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>

  <UiForm ref="formRef">
    <UiWindow v-model="currentTab" class="mt-6">
      <!-- Tab 1: Kişisel Bilgiler -->
      <UiWindowItem value="personal">
        <div class="ui-container">
          <!-- Profil fotoğrafı: yalnızca düzenlemede (kullanıcı kaydı olmalı); hemen kaydedilir -->
          <div v-if="user" class="flex items-center gap-4 mb-4">
            <ProfilePhotoEditor
              :url="photoUrl"
              :initials="`${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()"
              :user-id="user.id"
              :size="72"
              @changed="onPhotoChanged"
            />
            <p class="text-body-sm text-on-surface-variant">
              Profil fotoğrafı (JPEG, PNG veya WEBP, en fazla 10 MB). Değişiklik hemen kaydedilir.
            </p>
          </div>
          <div class="ui-row">
            <div class="ui-col ui-col-12 ui-col-sm-6">
              <UiTextField
                v-model="formData.firstName"
                label="Ad"
                :disabled="loading"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                hide-details="auto"
                :rules="[rules.required, rules.minLength(2)]"
                class="modern-input"
              />
            </div>
            <div class="ui-col ui-col-12 ui-col-sm-6">
              <UiTextField
                v-model="formData.lastName"
                label="Soyad"
                :disabled="loading"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                hide-details="auto"
                :rules="[rules.required, rules.minLength(2)]"
                class="modern-input"
              />
            </div>
          </div>

          <div class="ui-row">
            <div class="ui-col ui-col-12 ui-col-sm-6">
              <UiTextField
                v-model="formData.email"
                label="E-posta"
                :disabled="loading || !!user"
                prepend-inner-icon="mdi-email"
                density="comfortable"
                hide-details="auto"
                type="email"
                :rules="[rules.required, rules.email]"
                class="modern-input"
              />
            </div>
            <div class="ui-col ui-col-12 ui-col-sm-6">
              <UiTextField
                v-model="formData.phoneNumber"
                label="Telefon Numarası"
                :disabled="loading"
                prepend-inner-icon="mdi-phone"
                density="comfortable"
                hide-details="auto"
                type="tel"
                :rules="[rules.phone]"
                class="modern-input"
              />
            </div>
          <!-- Tenant seçici: Sadece SuperAdmin yeni kullanıcı oluştururken -->
          <div class="ui-col ui-col-12 ui-col-sm-6" v-if="!user && canAccessAllTenants">
            <UiSelect
              v-model="formData.tenantId"
              :items="tenants"
              item-title="name"
              item-value="id"
              label="Tenant"
              :disabled="loading"
              prepend-inner-icon="mdi-domain"
              density="comfortable"
              hide-details="auto"
              clearable
              class="modern-input"
            />
          </div>
        </div>

        <!-- Status (Sadece edit modunda) -->
        <div class="ui-row" v-if="user">
          <div class="ui-col ui-col-12">
            <UiSwitch
              v-model="formData.status"
              :true-value="UserStatus.Active"
              :false-value="UserStatus.Inactive"
              color="primary"
              :disabled="loading"
              hide-details
              class="status-switch"
            >
              <template #label>
                <div class="status-label">
                  <span class="status-text">Kullanıcı Durumu</span>
                  <UiChip
                    :color="formData.status === UserStatus.Active ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ formData.status === UserStatus.Active ? 'Aktif' : 'Pasif' }}
                  </UiChip>
                </div>
              </template>
            </UiSwitch>
            <p class="status-description mt-2">
              {{ formData.status === UserStatus.Active
                  ? 'Kullanıcı sisteme giriş yapabilir ve tüm yetkilerini kullanabilir.'
                  : 'Kullanıcı sisteme giriş yapamaz ve hesabı devre dışıdır.'
              }}
            </p>
          </div>
        </div>

        <!-- Zorunlu şifre değişimi (kendi hesabı hariç; hesap davetiyle gelen kullanıcı şifresini zaten kendisi belirler) -->
        <div class="ui-row" v-if="!isOwnAccount && (user || !formData.sendAccountInvitation)">
          <div class="ui-col ui-col-12">
            <UiSwitch
              v-model="formData.mustChangePassword"
              color="primary"
              :disabled="loading"
              hide-details
              class="status-switch"
            >
              <template #label>
                <span class="status-text">Bir sonraki girişte şifre değiştirsin</span>
              </template>
            </UiSwitch>
            <p class="status-description mt-2">
              {{ formData.mustChangePassword
                  ? 'Kullanıcı giriş yaptığında şifresini değiştirmeden uygulamayı kullanamaz.'
                  : 'Kullanıcı mevcut şifresiyle normal şekilde giriş yapar.'
              }}
            </p>
          </div>
        </div>
      </div>
    </UiWindowItem>

    <!-- Tab 2: Giriş bilgisi (Sadece yeni kullanıcı) -->
    <UiWindowItem v-if="!user" value="password">
      <div class="ui-container">
        <div class="ui-row">
          <div class="ui-col ui-col-12">
            <div class="login-method-grid">
              <button
                v-for="option in loginMethodOptions"
                :key="String(option.value)"
                type="button"
                class="login-method"
                :class="{ selected: formData.sendAccountInvitation === option.value }"
                :disabled="loading"
                @click="formData.sendAccountInvitation = option.value"
              >
                <UiIcon :icon="option.icon" :size="22" class="login-method-icon" />
                <span class="login-method-title">{{ option.title }}</span>
                <span class="login-method-text">{{ option.text }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Hesap daveti yalnızca şifre belirleme linkidir; haneye üyelik açmaz (hane daveti ayrıdır) -->
        <div class="ui-row" v-if="formData.sendAccountInvitation">
          <div class="ui-col ui-col-12">
            <p class="status-description">
              Kullanıcının e-posta adresine<template v-if="formData.email"> (<strong>{{ formData.email }}</strong>)</template>
              şifresini belirleyebileceği bir link gönderilir.
              Link 72 saat geçerlidir; süresi dolarsa kullanıcı listesinden daveti tekrar gönderebilirsiniz.
              Hesap hanesiz oluşur; haneye hane daveti ile katılır.
            </p>
          </div>
        </div>

        <template v-else>
        <div class="ui-row">
          <div class="ui-col ui-col-12">
            <UiTextField
              v-model="formData.password"
              label="Şifre"
              :disabled="loading"
              :type="showPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              density="comfortable"
              hide-details="auto"
              :rules="[rules.password]"
              class="modern-input"
            />
          </div>
        </div>

        <div class="ui-row">
          <div class="ui-col ui-col-12">
            <UiTextField
              v-model="formData.confirmPassword"
              label="Şifre Tekrar"
              :disabled="loading"
              :type="showConfirmPassword ? 'text' : 'password'"
              prepend-inner-icon="mdi-lock-check"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
              density="comfortable"
              hide-details="auto"
              :rules="[rules.confirmPassword(formData.password)]"
              class="modern-input"
            />
          </div>
        </div>
        </template>
      </div>
    </UiWindowItem>

    <!-- Tab 3: Roller -->
    <UiWindowItem value="roles">
      <div class="ui-container">
        <div class="ui-row" v-if="assignableRoles && assignableRoles.length">
          <div class="ui-col ui-col-12">
            <UiTextField
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
              class="mb-4 modern-input"
            />

            <div class="quick-actions mb-4">
              <UiBtn
                variant="outlined"
                size="small"
                @click="selectAllRoles"
                :disabled="loading"
                prepend-icon="mdi-check-all"
              >
                Tümünü Seç
              </UiBtn>
              <UiBtn
                variant="outlined"
                size="small"
                @click="clearAllRoles"
                :disabled="loading"
                prepend-icon="mdi-close-box"
              >
                Temizle
              </UiBtn>
              <UiChip 
                v-if="formData.roleIds.length" 
                size="small" 
                color="primary" 
                variant="tonal"
              >
                {{ formData.roleIds.length }} seçili
              </UiChip>
            </div>

            <div class="roles-grid">
              <div
                v-for="role in filteredRoles"
                :key="role.id"
                class="role-item"
                :class="{ 'selected': formData.roleIds.includes(String(role.id)) }"
              >
                <UiCheckbox
                  v-model="formData.roleIds"
                  :value="String(role.id)"
                  :disabled="loading"
                  color="primary"
                  hide-details
                  class="role-checkbox"
                />
                <div class="role-info">
                  <div class="role-header">
                    <h4 class="role-name">{{ role.name }}</h4>
                    <UiChip
                      v-if="role.isSystemRole"
                      size="x-small"
                      color="orange"
                      variant="tonal"
                    >
                      Sistem
                    </UiChip>
                  </div>
                  <p v-if="role.description" class="role-description">
                    {{ role.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="ui-row" v-else>
          <div class="ui-col ui-col-12">
            <div class="empty-state">
              <UiIcon icon="mdi-shield-off" :size="64" color="grey-400" />
              <h3 class="empty-title">Rol Bulunamadı</h3>
              <p class="empty-text">Atanabilir rol bulunmuyor</p>
            </div>
          </div>
        </div>
      </div>
    </UiWindowItem>
    </UiWindow>

    <!-- Modern Actions -->
    <div class="form-actions">
      <UiBtn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
        :disabled="loading"
        class="btn-gradient-dark"
      >
        İptal
      </UiBtn>
      
      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        @click="handleSubmit"
        class="btn-gradient-primary"
      >
        {{ user ? 'Güncelle' : 'Kaydet' }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { User, Role, CreateUserRequest, UpdateUserRequest } from '~/types'
import { UserStatus } from '~/types'
import { computed, reactive, ref, watch, watchEffect, onMounted } from 'vue'

const { validationRules: rules } = useValidators()

const props = defineProps<{
  user?: User | null
  roles: Role[]
  loading?: boolean
}>()

const authStore = useAuthStore()
const { getTenants } = useTenants()
const tenants = ref<{ id: number; name: string }[]>([])
const canAccessAllTenants = computed(() => authStore.hasRole('SuperAdmin'))

const emit = defineEmits<{
  submit: [data: CreateUserRequest | UpdateUserRequest]
  cancel: []
  'update:selected-roles': [roleIds: string[]]
  'photo-changed': [url: string | null]
}>()

const photoUrl = ref<string | null>(props.user?.profileImageUrl ?? null)
watch(() => props.user?.profileImageUrl, (url) => { photoUrl.value = url ?? null })
const onPhotoChanged = (url: string | null) => {
  photoUrl.value = url
  emit('photo-changed', url)
}

const formRef = ref()
const currentTab = ref('personal')
const searchQuery = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isFormValid = computed(() => formRef.value?.isValid ?? false)

const tabs = computed(() => {
  const baseTabs = [
    { value: 'personal', label: 'Kişisel Bilgiler', icon: 'mdi-account' }
  ]
  
  if (!props.user) {
    baseTabs.push({ value: 'password', label: 'Giriş Bilgisi', icon: 'mdi-lock' })
  }
  
  baseTabs.push({ value: 'roles', label: 'Roller', icon: 'mdi-shield-account' })
  
  return baseTabs
})

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  status: UserStatus.Active,
  mustChangePassword: false,
  sendAccountInvitation: true,
  roleIds: [] as string[],
  tenantId: null as number | null
})

const loginMethodOptions = [
  { value: true, icon: 'mdi-email-fast-outline', title: 'Davet e-postası gönder', text: 'Kullanıcı şifresini kendisi belirler' },
  { value: false, icon: 'mdi-form-textbox-password', title: 'Şifreyi ben belirleyeceğim', text: 'Şifreyi kullanıcıya siz iletirsiniz' }
]

// Backend de engelliyor; admin kendi hesabını şifre değişimine kilitleyemez
const isOwnAccount = computed(
  () => !!props.user && String(props.user.id) === String(authStore.user?.id)
)

onMounted(async () => {
  if (canAccessAllTenants.value && !props.user) {
    try {
      const res = await getTenants(1, 100, '')
      tenants.value = (res?.data?.items ?? res?.data ?? []) as { id: number; name: string }[]
    } catch {
      tenants.value = []
    }
  }
})

// SuperAdmin sees every tenant's roles; only common roles and the target tenant's own roles are assignable
const targetTenantId = computed(() =>
  props.user ? props.user.tenantId : (formData.tenantId ?? authStore.user?.tenantId)
)

const assignableRoles = computed(() => {
  if (!canAccessAllTenants.value) return props.roles
  return props.roles.filter(role =>
    role.tenantId == null || Number(role.tenantId) === Number(targetTenantId.value)
  )
})

const filteredRoles = computed(() => {
  if (!searchQuery.value) return assignableRoles.value

  return assignableRoles.value.filter(role =>
    role.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const selectAllRoles = () => {
  formData.roleIds = assignableRoles.value.map(r => String(r.id))
}

const clearAllRoles = () => {
  formData.roleIds = []
}

const handleSubmit = async () => {
  const { valid } = await formRef.value?.validate()
  if (!valid) return

  const submitData: any = {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phoneNumber: formData.phoneNumber,
    status: formData.status,
    mustChangePassword: formData.mustChangePassword,
    roleIds: formData.roleIds.map(id => Number(id))
  }

  if (props.user) {
    submitData.id = Number(props.user.id)
  } else {
    submitData.sendAccountInvitation = formData.sendAccountInvitation
    if (formData.sendAccountInvitation) {
      submitData.mustChangePassword = false
    } else {
      submitData.password = formData.password
    }
    if (formData.tenantId != null) {
      submitData.tenantId = formData.tenantId
    }
  }
  
  emit('submit', submitData)
}

watch(() => formData.roleIds, (newIds) => {
  emit('update:selected-roles', newIds)
}, { deep: true })

// New user (SuperAdmin): drop selected roles that do not belong to the newly selected tenant
watch(() => formData.tenantId, () => {
  if (!canAccessAllTenants.value || props.user) return
  const allowedIds = new Set(assignableRoles.value.map(r => String(r.id)))
  formData.roleIds = formData.roleIds.filter(id => allowedIds.has(id))
})

watchEffect(() => {
  if (props.user) {
    Object.assign(formData, {
      firstName: props.user.firstName,
      lastName: props.user.lastName,
      email: props.user.email,
      phoneNumber: props.user.phoneNumber || '',
      status: props.user.status ?? UserStatus.Active,
      mustChangePassword: props.user.mustChangePassword ?? false,
      roleIds: props.user.roles?.map(r => String(r.id)) || [],
      password: '',
      confirmPassword: ''
    })
  } else {
    Object.assign(formData, {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      status: UserStatus.Active,
      mustChangePassword: false,
      sendAccountInvitation: true,
      roleIds: [],
      tenantId: null,
      password: '',
      confirmPassword: ''
    })
  }
})
</script>

<style scoped>
.status-switch {
  margin-bottom: 8px;
}

.login-method-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.login-method {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px;
  text-align: left;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.login-method:hover:not(:disabled) {
  border-color: #cbd5e1;
}

/* Rol kartlarıyla aynı seçili görünüm */
.login-method.selected {
  border-color: rgb(var(--color-primary));
  background: #f0f7ff;
}

.login-method-icon {
  color: rgb(var(--color-primary));
  margin-bottom: 4px;
}

.login-method-title {
  font-weight: 600;
  color: #1e293b;
}

.login-method-text {
  font-size: 0.8125rem;
  color: #64748b;
}

.status-label {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-text {
  font-weight: 500;
  color: #1e293b;
}

.status-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.quick-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.role-item {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  background: white;
}

.role-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.role-item.selected {
  border-color: rgb(var(--color-primary));
  background: #f0f7ff;
  box-shadow: 0 4px 12px rgb(var(--color-primary) / 0.1);
}

.role-checkbox {
  margin: 0 !important;
  flex-shrink: 0;
}

.role-checkbox :deep(.ui-check__row) {
  min-height: auto !important;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.role-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.role-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
}

.empty-text {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .roles-grid {
    grid-template-columns: 1fr;
  }
}
</style>

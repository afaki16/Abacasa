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
              {{ t('users.form.photoHint') }}
            </p>
          </div>
          <div class="ui-row">
            <div class="ui-col ui-col-12 ui-col-sm-6">
              <UiTextField
                v-model="formData.firstName"
                :label="t('users.form.firstName')"
                :placeholder="t('users.form.firstNamePlaceholder')"
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
                :label="t('users.form.lastName')"
                :placeholder="t('users.form.lastNamePlaceholder')"
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
                :label="t('users.form.email')"
                :placeholder="t('users.form.emailPlaceholder')"
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
                :label="t('users.form.phone')"
                placeholder="0555 000 00 00"
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
              :label="t('users.form.household')"
              :placeholder="t('users.form.householdPlaceholder')"
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
            <div class="toggle-card">
              <div>
                <span class="toggle-card-title">{{ t('users.form.statusTitle') }}</span>
                <span
                  class="toggle-card-sub"
                  :class="formData.status === UserStatus.Active ? 'toggle-card-sub--on' : 'toggle-card-sub--off'"
                >
                  {{ formData.status === UserStatus.Active ? t('common.active') : t('common.inactive') }}
                </span>
              </div>
              <UiSwitch
                v-model="formData.status"
                :true-value="UserStatus.Active"
                :false-value="UserStatus.Inactive"
                color="primary"
                :disabled="loading"
                hide-details
              />
            </div>
            <p class="status-description !mt-2">
              {{ formData.status === UserStatus.Active
                  ? t('users.form.statusActiveDesc')
                  : t('users.form.statusInactiveDesc')
              }}
            </p>
          </div>
        </div>

        <!-- Zorunlu şifre değişimi (kendi hesabı hariç; hesap davetiyle gelen kullanıcı şifresini zaten kendisi belirler) -->
        <div class="ui-row" v-if="!isOwnAccount && (user || !formData.sendAccountInvitation)">
          <div class="ui-col ui-col-12">
            <div class="toggle-card">
              <div>
                <span class="toggle-card-title">{{ t('users.form.mustChangeTitle') }}</span>
                <span
                  class="toggle-card-sub"
                  :class="formData.mustChangePassword ? 'toggle-card-sub--warn' : ''"
                >
                  {{ formData.mustChangePassword ? t('users.form.mustChangeOn') : t('users.form.mustChangeOff') }}
                </span>
              </div>
              <UiSwitch
                v-model="formData.mustChangePassword"
                color="primary"
                :disabled="loading"
                hide-details
              />
            </div>
            <p class="status-description !mt-2">
              {{ formData.mustChangePassword
                  ? t('users.form.mustChangeOnDesc')
                  : t('users.form.mustChangeOffDesc')
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
            <i18n-t keypath="users.form.invitationInfo" tag="p" class="status-description" scope="global">
              <template #email><template v-if="formData.email"> (<strong>{{ formData.email }}</strong>)</template></template>
            </i18n-t>
          </div>
        </div>

        <template v-else>
        <div class="ui-row">
          <div class="ui-col ui-col-12">
            <UiTextField
              v-model="formData.password"
              :label="t('users.form.password')"
              placeholder="••••••••"
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
              :label="t('users.form.passwordRepeat')"
              placeholder="••••••••"
              required
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
              :placeholder="t('users.form.searchRoles')"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              hide-details
              clearable
              class="mb-4 modern-input"
            />

            <div class="select-all-bar mb-4">
              <UiCheckbox
                :model-value="allRolesSelected"
                :indeterminate="someRolesSelected"
                :disabled="loading"
                color="primary"
                hide-details
                density="compact"
                :label="t('common.selectAll')"
                @update:model-value="toggleAllRoles"
              />
              <span class="select-all-count">{{ t('common.selectedCount', { selected: formData.roleIds.length, total: assignableRoles.length }) }}</span>
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
                      {{ t('users.form.systemRole') }}
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
              <h3 class="empty-title">{{ t('users.form.noRolesTitle') }}</h3>
              <p class="empty-text">{{ t('users.form.noRolesText') }}</p>
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
        {{ t('common.cancel') }}
      </UiBtn>
      <UiBtn
        size="large"
        :loading="loading"
        :disabled="loading || !isFormValid"
        @click="handleSubmit"
        class="btn-gradient-primary"
      >
        {{ user ? t('common.update') : t('common.save') }}
      </UiBtn>
    </div>
  </UiForm>
</template>

<script setup lang="ts">
import type { User, Role, CreateUserRequest, UpdateUserRequest } from '~/types'
import { UserStatus } from '~/types'
import { computed, reactive, ref, watch, watchEffect, onMounted } from 'vue'

const { validationRules: rules } = useValidators()
const { t } = useI18n()

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
    { value: 'personal', label: t('users.form.tabPersonal'), icon: 'mdi-account' }
  ]
  
  if (!props.user) {
    baseTabs.push({ value: 'password', label: t('users.form.tabLogin'), icon: 'mdi-lock' })
  }
  
  baseTabs.push({ value: 'roles', label: t('users.form.tabRoles'), icon: 'mdi-shield-account' })
  
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

const loginMethodOptions = computed(() => [
  { value: true, icon: 'mdi-email-fast-outline', title: t('users.form.inviteTitle'), text: t('users.form.inviteText') },
  { value: false, icon: 'mdi-form-textbox-password', title: t('users.form.manualTitle'), text: t('users.form.manualText') }
])

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

const allRolesSelected = computed(() =>
  assignableRoles.value.length > 0 && formData.roleIds.length >= assignableRoles.value.length)
const someRolesSelected = computed(() => formData.roleIds.length > 0 && !allRolesSelected.value)
const toggleAllRoles = (checked: boolean) => (checked ? selectAllRoles() : clearAllRoles())

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
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
}

.login-method:hover:not(:disabled) {
  border-color: #cbd5e1;
}

.login-method.selected {
  border-color: rgb(var(--color-brand));
  background: rgb(var(--color-brand) / 0.06);
}

.login-method-icon {
  color: rgb(var(--color-brand));
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
  /* margin yok: reset zaten 0; üstteki boşluk şablondaki mt-2 ile verilir */
  line-height: 1.5;
}

/* Tümünü seç: tek onay kutusu (kısmi seçimde yarım işaret) + seçim sayacı */
.select-all-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border: 1px solid rgb(var(--color-outline-variant) / 0.6);
  border-radius: 10px;
  background: rgb(var(--color-surface-container-low));
}
.select-all-count {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgb(var(--color-brand) / 0.1);
  color: rgb(var(--color-brand));
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

<template>
  <!-- Başlık: hane adı -->
  <div class="flex items-center flex-wrap gap-2 mb-4">
    <UiIcon icon="mdi-home-heart" :size="28" />
    <h1 class="text-[1.5rem] leading-[2rem] font-bold mb-0">{{ household?.name ?? 'Hane' }}</h1>
    <UiBtn v-if="canUpdateHousehold" icon="mdi-pencil" size="small" variant="text" title="Düzenle" @click="openRename" />
    <div class="flex-1" />
    <span v-if="household" class="text-[0.75rem] leading-[1.667] tracking-[0.0333333333em] font-normal text-black/60 dark:text-white/70">{{ household.memberCount }} üye</span>
    <UiBtn
      v-if="canUpdateHousehold"
      size="small"
      variant="tonal"
      prepend-icon="mdi-microsoft-excel"
      :loading="exporting"
      :disabled="exporting"
      @click="exportHousehold"
    >
      Hane verisini indir (Excel)
    </UiBtn>
  </div>

  <!-- Üyeler -->
  <UiCard elevation="0" border class="mb-6">
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-bold">Üyeler</div>
    <table class="ui-table ui-table--comfortable">
      <thead>
        <tr>
          <th>Ad</th>
          <th>E-posta</th>
          <th>Rol</th>
          <th>Bağlı kişi</th>
          <th>Katılma tarihi</th>
          <th class="!text-right">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in members" :key="m.membershipId">
          <td>
            {{ m.fullName }}
            <span v-if="m.isCurrentUser" class="text-black/60 dark:text-white/70">(siz)</span>
          </td>
          <td>{{ m.email }}</td>
          <td>
            <UiChip size="small" :color="m.role === 'Admin' ? 'primary' : undefined" variant="tonal">{{ getRoleLabel(m.role) }}</UiChip>
          </td>
          <td>{{ m.personName ?? '—' }}</td>
          <td>{{ formatDisplayDate(m.joinedAt) }}</td>
          <td class="!text-right whitespace-nowrap">
            <UiBtn v-if="canUpdateMembers" icon="mdi-account-edit" size="x-small" variant="text" title="Rol ve kişi" @click="openMemberEdit(m)" />
            <UiBtn
              v-if="canDeleteMembers && !m.isCurrentUser"
              icon="mdi-account-remove"
              size="x-small"
              variant="text"
              color="error"
              title="Çıkar"
              @click="memberToRemove = m"
            />
            <UiBtn v-if="m.isCurrentUser" size="small" variant="text" color="error" @click="leaveDialog = true">Haneden ayrıl</UiBtn>
          </td>
        </tr>
        <tr v-if="!members.length">
          <td colspan="6" class="text-black/60 dark:text-white/70">Üye yok</td>
        </tr>
      </tbody>
    </table>
  </UiCard>

  <!-- Modüller (yalnızca yönetici: Household.Update) -->
  <UiCard v-if="canUpdateHousehold" elevation="0" border class="mb-6">
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-bold">Modüller</div>
    <div class="ui-card-text">
      <div class="toggle-card">
        <div>
          <span class="toggle-card-title">Bağış hedefleri ve emanetler</span>
          <span class="toggle-card-sub">Yıllık bağış ve zekat hedefleri, başkasının verdiği emanetlerin takibi.</span>
        </div>
        <UiSwitch
          :model-value="donationExtras"
          color="primary"
          hide-details
          :disabled="savingModules"
          aria-label="Bağış hedefleri ve emanetler"
          @update:model-value="toggleDonationExtras"
        />
      </div>
    </div>
  </UiCard>

  <!-- Davetler -->
  <UiCard v-if="canReadMembers" elevation="0" border>
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-bold">
      <div class="flex items-center">
        Davetler
        <div class="flex-1" />
        <UiBtn v-if="canCreateMembers" color="primary" size="small" prepend-icon="mdi-email-plus" @click="openInvite">Davet et</UiBtn>
      </div>
    </div>
    <table class="ui-table ui-table--comfortable">
      <thead>
        <tr>
          <th>E-posta</th>
          <th>Rol</th>
          <th>Bağlı kişi</th>
          <th>Durum</th>
          <th>Son geçerlilik</th>
          <th class="!text-right">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in invitations" :key="i.id">
          <td>{{ i.email }}</td>
          <td>{{ getRoleLabel(i.role) }}</td>
          <td>{{ i.personName ?? '—' }}</td>
          <td>
            <UiChip size="small" variant="tonal" :color="statusColor(i.status)">{{ invitationStatusLabel(i.status) }}</UiChip>
          </td>
          <td>{{ formatDisplayDate(i.expiresAt) }}</td>
          <td class="!text-right whitespace-nowrap">
            <UiBtn
              v-if="canCreateMembers && (i.status === 'Pending' || i.status === 'Expired')"
              size="small"
              variant="text"
              :loading="busyInvitationId === i.id"
              @click="resend(i)"
            >
              Yeniden gönder
            </UiBtn>
            <UiBtn v-if="canDeleteMembers && i.status === 'Pending'" size="small" variant="text" color="error" @click="invitationToRevoke = i">
              İptal
            </UiBtn>
          </td>
        </tr>
        <tr v-if="!invitations.length">
          <td colspan="6" class="text-black/60 dark:text-white/70">Davet yok</td>
        </tr>
      </tbody>
    </table>
  </UiCard>

  <!-- Haneyi sil (eski outlined + color="error" görünümü: çerçeve ve başlık hata renginde) -->
  <UiCard v-if="canDeleteHousehold" elevation="0" border class="danger-card mt-6">
    <div class="ui-card-title !text-[1rem] !leading-[1.75rem] !tracking-[0.009375em] !font-bold">Haneyi sil</div>
    <div class="ui-card-text">
      <p class="mb-4 text-black/[0.87] dark:text-white/[0.87]">
        Hanenin bütün kayıtları (harcamalar, borçlar, planlar, kişiler…), üyelikleri ve davetleri kalıcı olarak silinir. Bu işlem geri
        alınamaz.
      </p>
      <UiForm @submit="removeHousehold">
        <div class="ui-row ui-row--dense">
          <div class="ui-col ui-col-12 ui-col-sm-6">
            <UiTextField
              v-model="deleteConfirmName"
              label="Onaylamak için hane adını yazın"
              :placeholder="household?.name"
              density="compact"
              :disabled="deleting"
            />
          </div>
          <div class="ui-col ui-col-12 ui-col-sm-6">
            <UiTextField
              v-model="deletePassword"
              label="Parola"
              type="password"
              autocomplete="current-password"
              density="compact"
              :disabled="deleting"
            />
          </div>
        </div>
        <UiAlert v-if="deleteErrors.length" type="error" variant="tonal" density="compact" class="mb-3">
          <div v-for="(e, idx) in deleteErrors" :key="idx">{{ e }}</div>
        </UiAlert>
        <UiBtn type="submit" color="error" :loading="deleting" :disabled="!canConfirmDelete">Haneyi kalıcı olarak sil</UiBtn>
      </UiForm>
    </div>
  </UiCard>

  <!-- Hane adı -->
  <UiDialog v-model="renameDialog" max-width="440">
    <UiCard rounded="xl">
      <div class="dialog-head">
        <div class="dialog-head__icon"><UiIcon icon="mdi-home-edit-outline" :size="20" /></div>
        <div>
          <h3 class="dialog-head__title">Hane adını düzenle</h3>
          <p class="dialog-head__sub">Hane adı tüm üyelere görünür.</p>
        </div>
      </div>
      <UiForm ref="renameFormRef" @submit="saveRename">
        <div class="dialog-body">
          <UiTextField
            v-model="renameValue"
            label="Hane adı"
            placeholder="Örn. Yılmaz ailesi"
            density="compact"
            counter="100"
            autofocus
            :rules="[requiredRule('Hane adı'), maxRule('Hane adı', 100)]"
            :disabled="busy"
          />
        </div>
        <div class="dialog-actions">
          <UiBtn variant="outlined" class="btn-gradient-dark" :disabled="busy" @click="renameDialog = false">İptal</UiBtn>
          <UiBtn class="btn-gradient-primary" type="submit" :loading="busy">Kaydet</UiBtn>
        </div>
      </UiForm>
    </UiCard>
  </UiDialog>

  <!-- Rol ve kişi -->
  <UiDialog v-model="memberDialog" max-width="480">
    <UiCard v-if="editingMember" rounded="xl">
      <div class="dialog-head">
        <div class="dialog-head__icon"><UiIcon icon="mdi-account-edit-outline" :size="20" /></div>
        <div>
          <h3 class="dialog-head__title">{{ editingMember.fullName }}</h3>
          <p class="dialog-head__sub">Hanedeki rolü ve bağlı kişi</p>
        </div>
      </div>
      <div class="dialog-body">
        <UiSelect v-model="memberRole" :items="roleItems" label="Rol" density="compact" class="mb-3" :disabled="busy" />
        <UiSelect
          v-model="memberPersonId"
          :items="personItemsFor(editingMember.personId)"
          label="Bağlı kişi"
          density="compact"
          clearable
          :disabled="busy"
        />
        <UiAlert v-if="dialogErrors.length" type="error" variant="tonal" density="compact" class="mt-3">
          <div v-for="(e, idx) in dialogErrors" :key="idx">{{ e }}</div>
        </UiAlert>
      </div>
      <div class="dialog-actions">
        <UiBtn variant="outlined" class="btn-gradient-dark" :disabled="busy" @click="memberDialog = false">İptal</UiBtn>
        <UiBtn class="btn-gradient-primary" :loading="busy" @click="saveMember">Kaydet</UiBtn>
      </div>
    </UiCard>
  </UiDialog>

  <!-- Davet et -->
  <UiDialog v-model="inviteDialog" max-width="480">
    <UiCard rounded="xl">
      <div class="dialog-head">
        <div class="dialog-head__icon"><UiIcon icon="mdi-email-plus-outline" :size="20" /></div>
        <div>
          <h3 class="dialog-head__title">Davet et</h3>
          <p class="dialog-head__sub">Davet bağlantısı 7 gün geçerlidir.</p>
        </div>
      </div>
      <UiForm ref="inviteFormRef" @submit="sendInvite">
        <div class="dialog-body">
          <UiTextField
            v-model="inviteEmail"
            label="E-posta"
            placeholder="ornek@sirket.com"
            type="email"
            density="compact"
            class="mb-3"
            autofocus
            :rules="[requiredRule('E-posta'), emailRule]"
            :disabled="busy"
          />
          <UiSelect v-model="inviteRole" :items="roleItems" label="Rol" density="compact" class="mb-3" :disabled="busy" />
          <UiSelect
            v-model="invitePersonId"
            :items="personItemsFor(null)"
            label="Bağlanacak kişi (isteğe bağlı)"
            density="compact"
            clearable
            :disabled="busy"
          />
          <UiAlert v-if="dialogErrors.length" type="error" variant="tonal" density="compact" class="mt-3">
            <div v-for="(e, idx) in dialogErrors" :key="idx">{{ e }}</div>
          </UiAlert>
        </div>
        <div class="dialog-actions">
          <UiBtn variant="outlined" class="btn-gradient-dark" :disabled="busy" @click="inviteDialog = false">İptal</UiBtn>
          <UiBtn class="btn-gradient-primary" type="submit" :loading="busy">Gönder</UiBtn>
        </div>
      </UiForm>
    </UiCard>
  </UiDialog>
  <ConfirmDialog
    :model-value="!!memberToRemove"
    title="Üyeyi çıkar"
    :message="`${memberToRemove?.fullName ?? ''} haneden çıkarılsın mı?`"
    type="error"
    confirm-text="Çıkar"
    :loading="busy"
    @confirm="removeSelectedMember"
    @cancel="memberToRemove = null"
  />

  <ConfirmDialog
    :model-value="leaveDialog"
    title="Haneden ayrıl"
    :message="`${household?.name ?? 'Bu'} hanesinden ayrılmak istediğinizden emin misiniz?`"
    type="error"
    confirm-text="Ayrıl"
    :loading="busy"
    @confirm="leave"
    @cancel="leaveDialog = false"
  />

  <ConfirmDialog
    :model-value="!!invitationToRevoke"
    title="Daveti iptal et"
    :message="`${invitationToRevoke?.email ?? ''} adresine gönderilen davet iptal edilsin mi?`"
    type="warning"
    confirm-text="İptal et"
    :loading="busy"
    @confirm="revokeSelected"
    @cancel="invitationToRevoke = null"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { HouseholdDetail, HouseholdInvitation, HouseholdMember, InvitationStatus, Person } from '~/types'
import { HouseholdRoleValue } from '~/types'
import ConfirmDialog from '~/components/UI/ConfirmDialog.vue'
import { formatDisplayDate } from '~/utils/period'
import { parseApiErrorMessages } from '~/utils/apiError'
import { API_ENDPOINTS } from '~/utils/apiEndpoints'

definePageMeta({
  title: 'Hane ve üyeler',
  requiresAuth: true,
  middleware: ['permission'],
  permissions: ['Household.Read']
})

useHead({ title: 'Hane ve üyeler' })

//#region Composables
const { hasPermission } = useAuth()
const toast = useToast()
const { getPeople } = usePeople()
const {
  getRoleLabel, getHousehold, updateHousehold, getMembers, updateMember, removeMember, leaveHousehold,
  getInvitations, createInvitation, resendInvitation, revokeInvitation, invitationStatusLabel, deleteHousehold, updateModules
} = useHousehold()
//#endregion

// Her düğme kendi iznine bağlı ("Haneden ayrıl" herkese açık)
const canUpdateHousehold = computed(() => hasPermission('Household.Update'))
const canReadMembers = computed(() => hasPermission('HouseholdMembers.Read'))
const canCreateMembers = computed(() => hasPermission('HouseholdMembers.Create'))
const canUpdateMembers = computed(() => hasPermission('HouseholdMembers.Update'))
const canDeleteMembers = computed(() => hasPermission('HouseholdMembers.Delete'))
const canDeleteHousehold = computed(() => hasPermission('Household.Delete'))

const household = ref<HouseholdDetail | null>(null)
const members = ref<HouseholdMember[]>([])
const invitations = ref<HouseholdInvitation[]>([])
const people = ref<Person[]>([])
const busy = ref(false)
const dialogErrors = ref<string[]>([])

const roleItems = [
  { title: 'Yönetici', value: HouseholdRoleValue.Admin },
  { title: 'Üye', value: HouseholdRoleValue.Member }
]

const requiredRule = (label: string) => (v: string) => !!v?.trim() || `${label} zorunludur`
const maxRule = (label: string, max: number) => (v: string) => (v ?? '').trim().length <= max || `${label} en fazla ${max} karakter olabilir`
const emailRule = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v ?? '') || 'Geçerli bir e-posta girin'

const statusColor = (status: InvitationStatus) =>
  status === 'Pending' ? 'warning' : status === 'Accepted' ? 'success' : undefined

// Kişi listesi: başka üyeliğe bağlı olmayanlar (düzenlenen üyenin kendi kişisi listede kalır)
const personItemsFor = (ownPersonId?: number | null) => {
  const linked = new Set(members.value.map((m) => m.personId).filter((id): id is number => !!id && id !== ownPersonId))
  return people.value.filter((p) => !linked.has(Number(p.id))).map((p) => ({ title: p.name, value: Number(p.id) }))
}

//#region Yükleme
const loadMembers = async () => {
  members.value = await getMembers()
}
const loadInvitations = async () => {
  if (canReadMembers.value) invitations.value = await getInvitations()
}
const loadHousehold = async () => {
  household.value = await getHousehold()
}
const refreshAll = async () => {
  await Promise.all([loadHousehold(), loadMembers(), loadInvitations()])
}
//#endregion

//#region Hane adı
const renameDialog = ref(false)
const renameValue = ref('')
const renameFormRef = ref()

const openRename = () => {
  renameValue.value = household.value?.name ?? ''
  renameDialog.value = true
}

const saveRename = async () => {
  const { valid } = await renameFormRef.value.validate()
  if (!valid) return
  busy.value = true
  try {
    household.value = await updateHousehold(renameValue.value.trim())
    renameDialog.value = false
    toast.success('Hane adı güncellendi')
  } catch {
    // hata toast'ı useApi'de
  } finally {
    busy.value = false
  }
}
//#endregion

//#region Üyeler
const memberDialog = ref(false)
const editingMember = ref<HouseholdMember | null>(null)
const memberRole = ref<HouseholdRoleValue>(HouseholdRoleValue.Member)
const memberPersonId = ref<number | null>(null)
const memberToRemove = ref<HouseholdMember | null>(null)
const leaveDialog = ref(false)

const openMemberEdit = (m: HouseholdMember) => {
  editingMember.value = m
  memberRole.value = m.role === 'Admin' ? HouseholdRoleValue.Admin : HouseholdRoleValue.Member
  memberPersonId.value = m.personId ?? null
  dialogErrors.value = []
  memberDialog.value = true
}

const saveMember = async () => {
  if (!editingMember.value) return
  busy.value = true
  dialogErrors.value = []
  try {
    await updateMember(editingMember.value.membershipId, memberRole.value, memberPersonId.value)
    memberDialog.value = false
    await refreshAll()
  } catch (error) {
    dialogErrors.value = parseApiErrorMessages(error, 'Üye güncellenemedi')
  } finally {
    busy.value = false
  }
}

const removeSelectedMember = async () => {
  if (!memberToRemove.value) return
  busy.value = true
  try {
    await removeMember(memberToRemove.value.membershipId)
    memberToRemove.value = null
    await refreshAll()
  } catch {
    // hata toast'ı useApi'de
  } finally {
    busy.value = false
  }
}

// Ayrılınca /dashboard'a tam yenileme; sunucu yeni aktif haneyi refresh'te seçer
const leave = async () => {
  busy.value = true
  try {
    await leaveHousehold()
  } catch {
    busy.value = false
    leaveDialog.value = false
  }
}
//#endregion

//#region Davetler
const inviteDialog = ref(false)
const inviteFormRef = ref()
const inviteEmail = ref('')
const inviteRole = ref<HouseholdRoleValue>(HouseholdRoleValue.Member)
const invitePersonId = ref<number | null>(null)
const invitationToRevoke = ref<HouseholdInvitation | null>(null)
const busyInvitationId = ref<number | null>(null)

const emailNotSentWarning = 'Davet oluşturuldu ama e-posta gönderilemedi; yeniden göndermeyi deneyin'

const openInvite = () => {
  inviteEmail.value = ''
  inviteRole.value = HouseholdRoleValue.Member
  invitePersonId.value = null
  dialogErrors.value = []
  inviteDialog.value = true
}

const sendInvite = async () => {
  const { valid } = await inviteFormRef.value.validate()
  if (!valid) return
  busy.value = true
  dialogErrors.value = []
  try {
    const result = await createInvitation(inviteEmail.value.trim(), inviteRole.value, invitePersonId.value)
    inviteDialog.value = false
    if (result.emailSent) toast.success('Davet gönderildi')
    else toast.warning(emailNotSentWarning)
    await loadInvitations()
  } catch (error) {
    dialogErrors.value = parseApiErrorMessages(error, 'Davet oluşturulamadı')
  } finally {
    busy.value = false
  }
}

const resend = async (i: HouseholdInvitation) => {
  busyInvitationId.value = i.id
  try {
    const result = await resendInvitation(i.id)
    if (result.emailSent) toast.success('Davet yeniden gönderildi')
    else toast.warning(emailNotSentWarning)
    await loadInvitations()
  } catch {
    // hata toast'ı useApi'de
  } finally {
    busyInvitationId.value = null
  }
}

const revokeSelected = async () => {
  if (!invitationToRevoke.value) return
  busy.value = true
  try {
    await revokeInvitation(invitationToRevoke.value.id)
    invitationToRevoke.value = null
    await loadInvitations()
  } catch {
    // hata toast'ı useApi'de
  } finally {
    busy.value = false
  }
}
//#endregion

//#region Modüller: değişince istek, ardından /me (menü ve sayfalar store'dan güncellenir)
const authStore = useAuthStore()
const donationExtras = computed(() => authStore.hasModule('donationExtras'))
const savingModules = ref(false)
const toggleDonationExtras = async (value: boolean | null) => {
  savingModules.value = true
  try {
    await updateModules({ donationExtras: !!value })
    toast.success(value ? 'Bağış hedefleri ve emanetler açıldı' : 'Bağış hedefleri ve emanetler kapatıldı')
  } catch {
    // hata toast'ı useApi'de; anahtar store'daki değere döner
  } finally {
    savingModules.value = false
  }
}
//#endregion

//#region Excel indirme (yalnızca yönetici: Household.Update); sürerken düğme kilitli
const { download } = useDownload()
const exporting = ref(false)
const exportHousehold = async () => {
  exporting.value = true
  try {
    await download(API_ENDPOINTS.HOUSEHOLD.EXPORT, 'abacasa-hane.xlsx')
  } catch {
    toast.error('Hane verisi indirilemedi')
  } finally {
    exporting.value = false
  }
}
//#endregion

//#region Haneyi sil
const deleteConfirmName = ref('')
const deletePassword = ref('')
const deleting = ref(false)
const deleteErrors = ref<string[]>([])

// Ad birebir (baş/son boşluk hariç) eşleşmeden ve parola girilmeden düğme pasif
const canConfirmDelete = computed(
  () => !!household.value && deleteConfirmName.value.trim() === household.value.name.trim() && !!deletePassword.value
)

// Başarıda /dashboard'a tam yenileme (useHousehold)
const removeHousehold = async () => {
  if (!canConfirmDelete.value) return
  deleting.value = true
  deleteErrors.value = []
  try {
    await deleteHousehold(deletePassword.value, deleteConfirmName.value)
  } catch (error) {
    deleteErrors.value = parseApiErrorMessages(error, 'Hane silinemedi')
    deleting.value = false
  }
}
//#endregion

onMounted(async () => {
  await refreshAll()
  // Kişi bağlama yalnızca yönetici işlemlerinde gerekir
  if ((canUpdateMembers.value || canCreateMembers.value) && hasPermission('People.Read')) {
    const res = await getPeople(1, 1000, '')
    people.value = res?.data?.items ?? []
  }
})
</script>

<style scoped>
.danger-card {
  border-color: rgb(var(--color-error));
}
.danger-card > .ui-card-title {
  color: rgb(var(--color-error));
}
</style>

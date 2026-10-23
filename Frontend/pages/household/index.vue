<template>
  <!-- Başlık: hane adı -->
  <div class="d-flex align-center flex-wrap ga-2 mb-4">
    <v-icon size="28">mdi-home-heart</v-icon>
    <h1 class="text-h5 font-weight-bold mb-0">{{ household?.name ?? 'Hane' }}</h1>
    <v-btn v-if="canUpdateHousehold" icon="mdi-pencil" size="small" variant="text" title="Düzenle" @click="openRename" />
    <v-spacer />
    <span v-if="household" class="text-caption text-medium-emphasis">{{ household.memberCount }} üye</span>
  </div>

  <!-- Üyeler -->
  <v-card variant="outlined" class="mb-6">
    <v-card-title class="text-subtitle-1 font-weight-bold">Üyeler</v-card-title>
    <v-table density="comfortable">
      <thead>
        <tr>
          <th>Ad</th>
          <th>E-posta</th>
          <th>Rol</th>
          <th>Bağlı kişi</th>
          <th>Katılma tarihi</th>
          <th class="text-right">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in members" :key="m.membershipId">
          <td>
            {{ m.fullName }}
            <span v-if="m.isCurrentUser" class="text-medium-emphasis">(siz)</span>
          </td>
          <td>{{ m.email }}</td>
          <td>
            <v-chip size="small" :color="m.role === 'Admin' ? 'primary' : undefined" variant="tonal">{{ getRoleLabel(m.role) }}</v-chip>
          </td>
          <td>{{ m.personName ?? '—' }}</td>
          <td>{{ formatDisplayDate(m.joinedAt) }}</td>
          <td class="text-right text-no-wrap">
            <v-btn v-if="canUpdateMembers" icon="mdi-account-edit" size="x-small" variant="text" title="Rol ve kişi" @click="openMemberEdit(m)" />
            <v-btn
              v-if="canDeleteMembers && !m.isCurrentUser"
              icon="mdi-account-remove"
              size="x-small"
              variant="text"
              color="error"
              title="Çıkar"
              @click="memberToRemove = m"
            />
            <v-btn v-if="m.isCurrentUser" size="small" variant="text" color="error" @click="leaveDialog = true">Haneden ayrıl</v-btn>
          </td>
        </tr>
        <tr v-if="!members.length">
          <td colspan="6" class="text-medium-emphasis">Üye yok</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <!-- Davetler -->
  <v-card v-if="canReadMembers" variant="outlined">
    <v-card-title class="d-flex align-center text-subtitle-1 font-weight-bold">
      Davetler
      <v-spacer />
      <v-btn v-if="canCreateMembers" color="primary" size="small" prepend-icon="mdi-email-plus" @click="openInvite">Davet et</v-btn>
    </v-card-title>
    <v-table density="comfortable">
      <thead>
        <tr>
          <th>E-posta</th>
          <th>Rol</th>
          <th>Bağlı kişi</th>
          <th>Durum</th>
          <th>Son geçerlilik</th>
          <th class="text-right">İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in invitations" :key="i.id">
          <td>{{ i.email }}</td>
          <td>{{ getRoleLabel(i.role) }}</td>
          <td>{{ i.personName ?? '—' }}</td>
          <td>
            <v-chip size="small" variant="tonal" :color="statusColor(i.status)">{{ invitationStatusLabel(i.status) }}</v-chip>
          </td>
          <td>{{ formatDisplayDate(i.expiresAt) }}</td>
          <td class="text-right text-no-wrap">
            <v-btn
              v-if="canCreateMembers && (i.status === 'Pending' || i.status === 'Expired')"
              size="small"
              variant="text"
              :loading="busyInvitationId === i.id"
              @click="resend(i)"
            >
              Yeniden gönder
            </v-btn>
            <v-btn v-if="canDeleteMembers && i.status === 'Pending'" size="small" variant="text" color="error" @click="invitationToRevoke = i">
              İptal
            </v-btn>
          </td>
        </tr>
        <tr v-if="!invitations.length">
          <td colspan="6" class="text-medium-emphasis">Davet yok</td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <!-- Haneyi sil -->
  <v-card v-if="canDeleteHousehold" variant="outlined" color="error" class="mt-6">
    <v-card-title class="text-subtitle-1 font-weight-bold">Haneyi sil</v-card-title>
    <v-card-text>
      <p class="mb-4 text-high-emphasis">
        Hanenin bütün kayıtları (harcamalar, borçlar, planlar, kişiler…), üyelikleri ve davetleri kalıcı olarak silinir. Bu işlem geri
        alınamaz.
      </p>
      <v-form @submit.prevent="removeHousehold">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="deleteConfirmName"
              label="Onaylamak için hane adını yazın"
              :placeholder="household?.name"
              variant="outlined"
              density="compact"
              :disabled="deleting"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="deletePassword"
              label="Parola"
              type="password"
              autocomplete="current-password"
              variant="outlined"
              density="compact"
              :disabled="deleting"
            />
          </v-col>
        </v-row>
        <v-alert v-if="deleteErrors.length" type="error" variant="tonal" density="compact" class="mb-3">
          <div v-for="(e, idx) in deleteErrors" :key="idx">{{ e }}</div>
        </v-alert>
        <v-btn type="submit" color="error" :loading="deleting" :disabled="!canConfirmDelete">Haneyi kalıcı olarak sil</v-btn>
      </v-form>
    </v-card-text>
  </v-card>

  <!-- Hane adı -->
  <v-dialog v-model="renameDialog" max-width="440">
    <v-card>
      <v-card-title>Hane adını düzenle</v-card-title>
      <v-card-text>
        <v-form ref="renameFormRef" @submit.prevent="saveRename">
          <v-text-field
            v-model="renameValue"
            label="Hane adı"
            variant="outlined"
            density="compact"
            counter="100"
            autofocus
            :rules="[requiredRule('Hane adı'), maxRule('Hane adı', 100)]"
            :disabled="busy"
          />
          <div class="d-flex justify-end ga-2 mt-2">
            <v-btn variant="text" :disabled="busy" @click="renameDialog = false">İptal</v-btn>
            <v-btn color="primary" type="submit" :loading="busy">Kaydet</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Rol ve kişi -->
  <v-dialog v-model="memberDialog" max-width="480">
    <v-card v-if="editingMember">
      <v-card-title>{{ editingMember.fullName }}</v-card-title>
      <v-card-text>
        <v-select v-model="memberRole" :items="roleItems" label="Rol" variant="outlined" density="compact" class="mb-3" :disabled="busy" />
        <v-select
          v-model="memberPersonId"
          :items="personItemsFor(editingMember.personId)"
          label="Bağlı kişi"
          variant="outlined"
          density="compact"
          clearable
          :disabled="busy"
        />
        <v-alert v-if="dialogErrors.length" type="error" variant="tonal" density="compact" class="mt-3">
          <div v-for="(e, idx) in dialogErrors" :key="idx">{{ e }}</div>
        </v-alert>
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" :disabled="busy" @click="memberDialog = false">İptal</v-btn>
          <v-btn color="primary" :loading="busy" @click="saveMember">Kaydet</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Davet et -->
  <v-dialog v-model="inviteDialog" max-width="480">
    <v-card>
      <v-card-title>Davet et</v-card-title>
      <v-card-text>
        <v-form ref="inviteFormRef" @submit.prevent="sendInvite">
          <v-text-field
            v-model="inviteEmail"
            label="E-posta"
            type="email"
            variant="outlined"
            density="compact"
            class="mb-3"
            autofocus
            :rules="[requiredRule('E-posta'), emailRule]"
            :disabled="busy"
          />
          <v-select v-model="inviteRole" :items="roleItems" label="Rol" variant="outlined" density="compact" class="mb-3" :disabled="busy" />
          <v-select
            v-model="invitePersonId"
            :items="personItemsFor(null)"
            label="Bağlanacak kişi (isteğe bağlı)"
            variant="outlined"
            density="compact"
            clearable
            :disabled="busy"
          />
          <v-alert v-if="dialogErrors.length" type="error" variant="tonal" density="compact" class="mt-3">
            <div v-for="(e, idx) in dialogErrors" :key="idx">{{ e }}</div>
          </v-alert>
          <div class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" :disabled="busy" @click="inviteDialog = false">İptal</v-btn>
            <v-btn color="primary" type="submit" :loading="busy">Gönder</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

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
  getInvitations, createInvitation, resendInvitation, revokeInvitation, invitationStatusLabel, deleteHousehold
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

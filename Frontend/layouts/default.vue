<template>
  <div class="flex h-[100dvh] w-full bg-background font-body-md text-on-surface antialiased overflow-hidden">
    <!-- Mobilde menü arka planı: dokununca menü kapanır -->
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-200" leave-to-class="opacity-0">
      <div v-if="isMobile && isMobileMenuOpen" class="fixed inset-0 z-40 bg-black/40" @click="isMobileMenuOpen = false" />
    </Transition>

    <!-- Sidebar Navigation: masaüstünde sabit (daraltılabilir), mobilde (<1024px) soldan açılan çekmece -->
    <aside
      class="flex flex-col h-full border-r border-outline-variant bg-surface py-base transition-all duration-300"
      :class="isMobile
        ? ['fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-xl', isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full']
        : ['z-30 flex-shrink-0', expanded ? 'w-64' : 'w-20']"
    >
      <!-- Logo + Brand + Toggle -->
      <div class="px-md py-md mb-md flex items-center" :class="expanded ? 'justify-between' : 'justify-center'">
        <div v-if="expanded" class="flex items-center gap-3 min-w-0">
          <img
            v-if="appData?.app?.logo?.src"
            :src="appData.app.logo.src"
            :alt="appData?.app?.logo?.alt || 'Logo'"
            class="object-contain flex-shrink-0 h-8 w-8"
          />
          <Icon
            v-else
            name="mdi:cloud"
            class="text-primary"
            style="font-size: 32px"
          />
          <h1 class="text-headline-md font-headline-md font-bold text-on-surface truncate">
            {{ appData?.app?.brand?.text || 'Abacasa' }}
          </h1>
        </div>
        <button
          @click="toggleSidebar"
          class="flex items-center justify-center w-10 h-10 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
          :title="isMobile ? $t('common.close') : (expanded ? $t('layout.collapse') : $t('layout.expand'))"
        >
          <Icon :name="isMobile ? 'mdi:close' : 'mdi:menu'" class="w-6 h-6" />
        </button>
      </div>

      <!-- Search (opsiyonel — sadece sidebar açıkken görünür) -->
      <div v-if="expanded" class="px-md mb-base">
        <div class="relative">
          <Icon name="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('layout.searchPlaceholder')"
            class="w-full bg-surface-container-low border border-solid border-outline-variant/[0.12] rounded-[10px] py-2 pl-10 pr-4 text-body-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-on-surface-variant/50 outline-none"
          />
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav :key="authStore.user?.id || 'guest'" class="flex-1 overflow-y-auto space-y-1 mt-md scrollbar-thin">
        <template v-for="item in filteredMenus" :key="item.title">
          <!-- Top-level item (no children) -->
          <NuxtLink
            v-if="!item.children && item.to"
            :to="item.to"
            class="flex items-center gap-3 mx-4 px-4 py-3 rounded-[10px] transition-all"
            :class="[
              isActive(item.to)
                ? 'sidebar-active-pill'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
              !expanded && 'justify-center px-0'
            ]"
            :title="!expanded ? $t(item.title) : undefined"
          >
            <Icon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="expanded" class="font-body-md font-semibold whitespace-nowrap">{{ $t(item.title) }}</span>
          </NuxtLink>

          <!-- Group with children -->
          <div v-else-if="item.children" class="pt-2">
            <p
              v-if="expanded"
              class="px-md py-xs text-label-sm uppercase text-on-surface-variant/40 font-bold tracking-widest"
            >
              {{ $t(item.title) }}
            </p>
            <div v-else class="border-t border-solid border-outline-variant/[0.12] my-2 mx-4"></div>

            <NuxtLink
              v-for="child in item.children"
              :key="child.title"
              :to="child.to"
              class="flex items-center gap-3 mx-4 px-4 py-3 rounded-[10px] transition-all"
              :class="[
                isActive(child.to)
                  ? 'sidebar-active-pill'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                !expanded && 'justify-center px-0'
              ]"
              :title="!expanded ? $t(child.title) : undefined"
            >
              <Icon :name="child.icon" class="w-5 h-5 flex-shrink-0" />
              <span v-if="expanded" class="font-body-md whitespace-nowrap">{{ $t(child.title) }}</span>
            </NuxtLink>
          </div>
        </template>
      </nav>

      <!-- Sidebar Footer: User + dropdown (profil, hane, gizlilik, çıkış) -->
      <div class="px-4 py-4 mt-auto border-t border-solid border-outline-variant/[0.12] relative">
        <!-- User Card — Dropdown Trigger -->
        <div class="relative user-menu-root">
          <button
            type="button"
            @click="toggleUserDropdown"
            class="w-full flex items-center gap-3 rounded-[10px] hover:bg-surface-container-high transition-all"
            :class="expanded ? 'px-2 py-2' : 'justify-center p-2'"
            :title="!expanded ? userInfo.name : undefined"
          >
            <!-- Avatar -->
            <UserAvatar :src="authStore.user?.profileImageUrl" :initials="authStore.userInitials" :size="40" />

            <!-- User Info (sadece açık sidebar'da) -->
            <div v-if="expanded" class="flex-1 min-w-0 text-left">
              <p class="text-body-sm font-bold text-on-surface truncate">{{ userInfo.name }}</p>
              <p class="text-label-sm text-on-surface-variant truncate">{{ userInfo.household }}</p>
              <p class="text-label-sm text-on-surface-variant truncate">{{ userInfo.email }}</p>
            </div>

            <!-- Caret (sadece açık sidebar'da) -->
            <Icon
              v-if="expanded"
              name="mdi:chevron-up"
              class="w-4 h-4 text-on-surface-variant flex-shrink-0 transition-transform"
              :class="{ 'rotate-180': showUserDropdown }"
            />
          </button>

          <!-- Dropdown Menu — yukarı açılır -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="showUserDropdown"
              class="user-dropdown-menu absolute bottom-full mb-2 bg-surface-container-low border border-solid border-outline-variant/[0.12] rounded-[10px] shadow-xl z-50 overflow-hidden"
              :class="expanded ? 'left-0 right-0' : 'left-full ml-2 w-48'"
            >
              <NuxtLink
                to="/profile"
                @click="closeUserDropdown"
                class="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <Icon name="mdi:account-circle" class="w-5 h-5 text-on-surface-variant" />
                <span class="text-body-sm font-medium">{{ $t('sidebar.menu.profile') }}</span>
              </NuxtLink>

              <NuxtLink
                v-if="authStore.hasPermission('Household.Read')"
                to="/household"
                @click="closeUserDropdown"
                class="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors border-t border-solid border-outline-variant/[0.12]"
              >
                <Icon name="mdi:home-heart" class="w-5 h-5 text-on-surface-variant" />
                <span class="text-body-sm font-medium">{{ $t('layout.householdSettings') }}</span>
              </NuxtLink>

              <NuxtLink
                :to="LEGAL_ROUTES.privacy"
                @click="closeUserDropdown"
                class="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors border-t border-solid border-outline-variant/[0.12]"
              >
                <Icon name="mdi:shield-account" class="w-5 h-5 text-on-surface-variant" />
                <span class="text-body-sm font-medium">{{ $t('layout.privacyAndTerms') }}</span>
              </NuxtLink>

              <!-- Ayarlar sol menüde (Admin/SuperAdmin); çıkış artık bu menüde -->
              <button
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 text-error/80 hover:text-error hover:bg-error/10 transition-colors border-t border-solid border-outline-variant/[0.12]"
                @click="handleLogoutFromMenu"
              >
                <Icon name="mdi:logout" class="w-5 h-5 flex-shrink-0" />
                <span class="text-body-sm font-medium">{{ $t('sidebar.actions.logout') }}</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="flex items-center justify-end gap-2 lg:gap-3 px-3 lg:px-margin-desktop py-2 lg:py-md border-b border-solid border-black/[0.12] dark:border-white/[0.12] bg-surface flex-shrink-0">
        <!-- Mobilde menüyü açan düğme -->
        <button
          v-if="isMobile"
          type="button"
          class="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
          :class="{ 'mr-auto': !isSuperAdmin }"
          :title="$t('layout.menu')"
          :aria-label="$t('layout.menu')"
          @click="isMobileMenuOpen = true"
        >
          <Icon name="mdi:menu" class="w-6 h-6" />
        </button>

        <!-- SuperAdmin hane filtresi: yalnızca sistem listelerini (kullanıcılar, oturumlar) süzer; bütçe verisini değiştirmez -->
        <div v-if="isSuperAdmin" class="flex items-center gap-2 mr-auto min-w-0">
          <Icon name="mdi:shield-crown-outline" class="w-4 h-4 text-on-surface-variant flex-shrink-0" />
          <span class="text-body-sm text-on-surface-variant font-medium hidden lg:inline whitespace-nowrap">{{ $t('sidebar.context.activeTenant') }}</span>
          <TenantSelector />
        </div>

        <!-- Hane seçici -->
        <HouseholdSwitcher />

        <!-- Language Switcher (mevcut component) -->
        <LanguageSwitcher v-if="showLanguageSwitcher" />

        <!-- Theme Toggle -->
        <button
          @click="toggleTheme"
          class="w-10 h-10 rounded-[24px] bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all flex items-center justify-center"
          :title="isDark ? $t('layout.switchToLight') : $t('layout.switchToDark')"
        >
          <Icon
            :name="isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'"
            class="w-5 h-5"
          />
        </button>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto px-4 lg:px-margin-desktop py-md">
        <slot />
      </main>

      <!-- Bekleyen onaylar: kapatılamayan pencere (yalnızca onay ya da çıkış) -->
      <ConsentGate />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { navigationItems, filterNavigationByPermissions } from '~/composables/useNavigation'
import { useAuth } from '~/composables/useAuth'
import { useAppData } from '~/composables/useAppData'
import { useAuthStore } from '~/stores/auth'
import { useTheme } from '~/composables/useTheme'
import HouseholdSwitcher from '~/components/Household/HouseholdSwitcher.vue'
import TenantSelector from '~/components/UI/TenantSelector.vue'
import ConsentGate from '~/components/Legal/ConsentGate.vue'
import { LEGAL_ROUTES } from '~/utils/legal'

const { t, locale } = useI18n()

// Auth state
const authStore = useAuthStore()
const { roles } = storeToRefs(authStore)
const isSuperAdmin = computed(() => roles.value.includes('SuperAdmin'))
const { activeTenant, getRoleLabel } = useHousehold()
const authUtils = useAuth()
const router = useRouter()
const route = useRoute()

// App data (logo, brand)
const { loadAppData, appData } = useAppData()

// Theme
const { isDark, toggleTheme } = useTheme()

// Sidebar state
const isSidebarOpen = ref(true)

// Mobil (<1024px): menü çekmece olarak açılır; çekmece her zaman geniş (ikon-only daraltma yalnızca masaüstünde)
const MOBILE_QUERY = '(max-width: 1023.98px)'
const isMobile = ref(import.meta.client ? window.matchMedia(MOBILE_QUERY).matches : false)
const isMobileMenuOpen = ref(false)
const expanded = computed(() => isMobile.value || isSidebarOpen.value)
let mobileMql: MediaQueryList | null = null
const onMobileChange = (e: MediaQueryListEvent) => {
  isMobile.value = e.matches
  if (!e.matches) isMobileMenuOpen.value = false
}
const onEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') isMobileMenuOpen.value = false
}
// Sayfa değişince çekmece kapanır
watch(() => route.fullPath, () => { isMobileMenuOpen.value = false })
const searchQuery = ref('')

// Language switcher görünürlüğü — opsiyonel, app config'inden okunabilir
const showLanguageSwitcher = computed(() => true)

// User info
const userInfo = computed(() => ({
  name: authStore.userFullName || t('layout.defaultUserName'),
  email: authStore.user?.email || '',
  household: activeTenant.value ? `${activeTenant.value.name} · ${getRoleLabel(activeTenant.value.role)}` : t('layout.noHousehold')
}))

// Yetkiye göre menüleri filtrele; öğesi kalmayan grup tamamen gizlenir
const visibleMenus = computed(() =>
  filterNavigationByPermissions(
    navigationItems,
    (p) => authStore.hasPermission(p),
    (r) => roles.value.includes(r),
    (m) => authStore.hasModule(m)
  )
)

// Search ile menüleri filtrele
const filteredMenus = computed(() => {
  if (!searchQuery.value.trim()) return visibleMenus.value

  // Menü başlıkları i18n anahtarı; arama ekranda görünen (çevrilmiş) adda, dile duyarlı küçük harfle yapılır (İ/ı)
  const lower = (s: string) => s.toLocaleLowerCase(locale.value)
  const query = lower(searchQuery.value.trim())
  const matches = (title: string) => lower(t(title)).includes(query)
  const filterChildren = (items: typeof visibleMenus.value): typeof visibleMenus.value => {
    return items
      .map((item) => {
        const titleMatch = matches(item.title)
        if (item.children) {
          const matchedChildren = item.children.filter((c) => matches(c.title))
          if (titleMatch || matchedChildren.length > 0) {
            return { ...item, children: matchedChildren.length > 0 ? matchedChildren : item.children }
          }
          return null
        }
        return titleMatch ? item : null
      })
      .filter((i): i is NonNullable<typeof i> => i !== null)
  }
  return filterChildren(visibleMenus.value)
})

// Aktif route kontrolü
const isActive = (to: string | undefined) => {
  if (!to) return false
  return route.path === to || route.path.startsWith(to + '/')
}

// Sidebar toggle
const toggleSidebar = () => {
  if (isMobile.value) isMobileMenuOpen.value = false
  else isSidebarOpen.value = !isSidebarOpen.value
}

// User dropdown state
const showUserDropdown = ref(false)

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const closeUserDropdown = () => {
  showUserDropdown.value = false
}

/**
 * Dropdown dışına tıklayınca kapansın.
 * Named function — onUnmounted'da temizlenebilir.
 */
const handleDocumentClickForUserDropdown = (e: MouseEvent) => {
  const target = e.target as HTMLElement | null
  if (!target) return
  if (!target.closest('.user-menu-root')) {
    showUserDropdown.value = false
  }
}

const handleLogoutFromMenu = async () => {
  closeUserDropdown()
  await handleLogout()
}

// Logout
const handleLogout = async () => {
  try {
    await authUtils.logout()
  } catch (error) {
    console.error('Çıkış yapılırken bir hata oluştu:', error)
  }
}

onMounted(async () => {
  await loadAppData()

  // Dropdown dışı tıklama listener
  if (import.meta.client) {
    document.addEventListener('click', handleDocumentClickForUserDropdown)
    document.addEventListener('keydown', onEscape)
    mobileMql = window.matchMedia(MOBILE_QUERY)
    mobileMql.addEventListener('change', onMobileChange)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleDocumentClickForUserDropdown)
    document.removeEventListener('keydown', onEscape)
    mobileMql?.removeEventListener('change', onMobileChange)
  }
})
</script>

<style scoped>
/* Active menu item — marka renginin hafif tonu (Dernify'daki gibi; renk data.json'daki primary'den gelir) */
.sidebar-active-pill {
  --pill-accent: rgb(var(--color-brand));
  background: rgb(var(--color-brand) / 0.1);
  color: var(--pill-accent) !important;
  box-shadow: none;
  border: 1px solid rgb(var(--color-brand) / 0.14);
}

.sidebar-active-pill :deep(.iconify),
.sidebar-active-pill span {
  color: var(--pill-accent) !important;
}

/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

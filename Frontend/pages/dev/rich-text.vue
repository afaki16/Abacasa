<template>
  <div class="space-y-md">
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
      <h1 class="text-headline-md font-headline-md text-on-surface">Zengin Metin (geliştirici vitrini)</h1>
      <p class="text-body-sm text-on-surface-variant mt-1">
        Yalnızca geliştirme ortamında açılır. Solda <code>RichTextEditor</code>, sağda backend'in
        <code>HtmlContentSanitizer</code> ile temizlediği ve <code>RichTextDisplay</code> ile gösterilen hali.
      </p>

      <!-- Frontend (DOMPurify) ve backend (HtmlSanitizer) izin listeleri aynı olmalı -->
      <div
        v-if="allowListDiff"
        class="mt-md rounded-lg px-md py-xs text-body-sm"
        :class="allowListDiff.inSync ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
      >
        <template v-if="allowListDiff.inSync">İzin listeleri uyumlu (frontend = backend).</template>
        <template v-else>
          İzin listeleri UYUMSUZ — önizlemede görünen öğeler kaydedince kaybolur.
          <span v-if="allowListDiff.onlyFrontend.length">Yalnızca frontend: {{ allowListDiff.onlyFrontend.join(', ') }}.</span>
          <span v-if="allowListDiff.onlyBackend.length">Yalnızca backend: {{ allowListDiff.onlyBackend.join(', ') }}.</span>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-md">
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
        <div class="flex items-center justify-between mb-xs">
          <h2 class="font-semibold text-on-surface">Editör</h2>
          <button
            type="button"
            class="text-body-sm text-primary hover:underline"
            @click="content = sampleXss"
          >
            XSS örneği yükle
          </button>
        </div>
        <RichTextEditor v-model="content" />
        <button
          type="button"
          class="mt-md inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-semibold disabled:opacity-60"
          :disabled="saving"
          @click="saveThroughBackend"
        >
          <Icon :name="saving ? 'mdi:loading' : 'mdi:content-save-outline'" class="w-4 h-4" :class="{ 'animate-spin': saving }" />
          Backend'den geçir
        </button>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
        <h2 class="font-semibold text-on-surface mb-xs">Kaydedilen hal (RichTextDisplay)</h2>
        <RichTextDisplay :content="savedHtml" />
        <details class="mt-md">
          <summary class="text-body-sm text-on-surface-variant cursor-pointer">Ham HTML</summary>
          <pre class="mt-xs text-xs whitespace-pre-wrap break-all bg-surface-container-low rounded p-xs">{{ savedHtml || '—' }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RICH_TEXT_ALLOWED_ATTR, RICH_TEXT_ALLOWED_TAGS } from '~/utils/richTextContent'

// Production'da bu sayfa yok (backend uçları da 404 döner)
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

definePageMeta({ title: 'Zengin Metin (dev)', requiresAuth: true })
useHead({ title: 'Zengin Metin (dev)' })

const api = useApi()
const toast = useToast()

const sampleXss =
  '<p>Normal metin, <strong>kalın</strong> ve <a href="https://example.com" target="_blank">link</a>.</p>' +
  '<p><img src="x" onerror="alert(1)">resim + onerror</p>' +
  '<p><a href="javascript:alert(2)">javascript: link</a></p>' +
  '<script>alert(3)<\/script>' +
  '<table><tr><td>Tablo hücresi</td></tr></table>' +
  '<p style="color:red">inline style</p>'

const content = ref('<p>Merhaba <strong>dünya</strong>!</p>')
const savedHtml = ref('')
const saving = ref(false)

const saveThroughBackend = async () => {
  saving.value = true
  try {
    const res = await api.post<{ html: string }>('/api/dev/sanitize-html', { html: content.value }, { silent: true })
    savedHtml.value = res?.data?.html ?? ''
  } catch {
    toast.error('Backend isteği başarısız.')
  } finally {
    saving.value = false
  }
}

const allowListDiff = ref<{ inSync: boolean; onlyFrontend: string[]; onlyBackend: string[] } | null>(null)

onMounted(async () => {
  try {
    const res = await api.get<{ tags: string[]; attributes: string[] }>('/api/dev/rich-text-allow-list', { silent: true })
    const backend = new Set([...(res?.data?.tags ?? []), ...(res?.data?.attributes ?? []).map(a => `@${a}`)])
    const frontend = new Set([...RICH_TEXT_ALLOWED_TAGS, ...RICH_TEXT_ALLOWED_ATTR.map(a => `@${a}`)])
    const onlyFrontend = [...frontend].filter(x => !backend.has(x))
    const onlyBackend = [...backend].filter(x => !frontend.has(x))
    allowListDiff.value = { inSync: !onlyFrontend.length && !onlyBackend.length, onlyFrontend, onlyBackend }
  } catch {
    allowListDiff.value = null
  }
})
</script>

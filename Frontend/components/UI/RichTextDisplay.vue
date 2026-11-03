<template>
  <div class="rtd" :class="containerClass" v-html="safeHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DOMPurify from 'dompurify'
import {
  hasHtmlTags,
  escapeHtml,
  recoverHtmlSource,
  RICH_TEXT_ALLOWED_TAGS,
  RICH_TEXT_ALLOWED_ATTR
} from '~/utils/richTextContent'

const props = defineProps<{
  content: string | null | undefined
  /** Extra CSS class on the wrapper (e.g. 'rtd--compact' for modals). */
  containerClass?: string
}>()

const safeHtml = computed(() => {
  const raw = props.content ?? ''
  if (!raw) return ''

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, {
      // Allow-list — TipTap'in ürettiği etiketler + tablo/div. Hiçbir inline
      // style, event handler veya javascript: URL geçmez.
      ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
      ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
      // javascript: gibi tehlikeli URI scheme'leri otomatik strip edilir
      ALLOW_DATA_ATTR: false,
      // Hem <a target="_blank"> hem rel'ler korunsun
      ADD_ATTR: ['target', 'rel']
    })

  // Kaynak kod olarak yapıştırılmış/saklanmış HTML dokümanı — gövdeyi çıkar ve render et
  const recovered = recoverHtmlSource(raw)
  if (recovered) return sanitize(recovered)

  // Geriye dönük uyumluluk: HTML etiketi yoksa düz metin gibi davran — satır
  // sonlarını <br> ile koru, ama HTML olarak değil escape edilmiş gövdeye yerleştir.
  if (!hasHtmlTags(raw)) {
    return `<p style="white-space: pre-wrap;">${escapeHtml(raw)}</p>`
  }

  return sanitize(raw)
})
</script>

<!-- Render edilen DOM Vue scope dışında, bu yüzden global selector kullanıyoruz -->
<style>
.rtd {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 13.5px;
  line-height: 1.75;
  color: #1e293b;
}
.rtd p { margin: 0 0 0.9em; }
.rtd p:last-child { margin-bottom: 0; }

.rtd h1, .rtd h2 {
  font-size: 1.1rem; font-weight: 800; color: #0f172a;
  margin: 1.3em 0 0.5em; line-height: 1.3;
}
.rtd h3 {
  font-size: 1rem; font-weight: 700; color: #1e293b;
  margin: 1.1em 0 0.4em; line-height: 1.3;
}
.rtd h4, .rtd h5, .rtd h6 {
  font-size: 0.95rem; font-weight: 700; color: #334155;
  margin: 1em 0 0.4em;
}
.rtd h1:first-child, .rtd h2:first-child, .rtd h3:first-child { margin-top: 0; }

.rtd strong { font-weight: 700; color: #0f172a; }
.rtd em     { font-style: italic; }
.rtd u      { text-decoration: underline; }
.rtd s      { text-decoration: line-through; color: #64748b; }

.rtd ul, .rtd ol {
  margin: 0.5em 0 0.9em;
  padding-left: 1.5em;
}
.rtd ul li, .rtd ol li { margin: 0.25em 0; }
.rtd ul { list-style: disc; }
.rtd ol { list-style: decimal; }
.rtd ul ul { list-style: circle; }
.rtd ul ul ul { list-style: square; }

.rtd a {
  color: #2563eb;
  text-decoration: underline;
  text-decoration-color: #93c5fd;
  text-underline-offset: 2px;
}
.rtd a:hover { text-decoration-color: #2563eb; }

.rtd table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8em 0 1em;
  font-size: 0.95em;
}
.rtd th, .rtd td {
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}
.rtd th { background: #f8fafc; font-weight: 700; color: #0f172a; }

/* Compact varyant — modal/sıkışık alanlar için */
.rtd.rtd--compact { font-size: 13px; line-height: 1.65; }
.rtd.rtd--compact h1, .rtd.rtd--compact h2 { font-size: 1rem; margin: 1em 0 0.4em; }
.rtd.rtd--compact h3 { font-size: 0.92rem; margin: 0.9em 0 0.3em; }
.rtd.rtd--compact p { margin-bottom: 0.7em; }
.rtd.rtd--compact ul, .rtd.rtd--compact ol { margin: 0.4em 0 0.7em; }
</style>

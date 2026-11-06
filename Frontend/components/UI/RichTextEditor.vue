<template>
  <div class="rich-editor" :class="{ 'rich-editor--focused': editorFocused }">
    <!-- Toolbar -->
    <div class="rte-toolbar" v-if="editor">
      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('bold') }"
        :title="$t('ui.richText.bold')"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <Icon name="mdi:format-bold" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('italic') }"
        :title="$t('ui.richText.italic')"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <Icon name="mdi:format-italic" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('underline') }"
        :title="$t('ui.richText.underline')"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <Icon name="mdi:format-underline" class="w-4 h-4" />
      </button>

      <div class="rte-sep" />

      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('heading', { level: 2 }) }"
        :title="$t('ui.richText.heading1')"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <span class="rte-h">H1</span>
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('heading', { level: 3 }) }"
        :title="$t('ui.richText.heading2')"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <span class="rte-h">H2</span>
      </button>

      <div class="rte-sep" />

      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('bulletList') }"
        :title="$t('ui.richText.bulletList')"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <Icon name="mdi:format-list-bulleted" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('orderedList') }"
        :title="$t('ui.richText.orderedList')"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <Icon name="mdi:format-list-numbered" class="w-4 h-4" />
      </button>

      <div class="rte-sep" />

      <button
        type="button"
        class="rte-btn"
        :class="{ 'rte-btn--active': editor.isActive('link') }"
        :title="$t('ui.richText.link')"
        @click="promptLink"
      >
        <Icon name="mdi:link-variant" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="rte-btn"
        :disabled="!editor.isActive('link')"
        :title="$t('ui.richText.unlink')"
        @click="editor.chain().focus().unsetLink().run()"
      >
        <Icon name="mdi:link-variant-off" class="w-4 h-4" />
      </button>

      <div class="rte-sep" />

      <button
        type="button"
        class="rte-btn"
        :title="$t('ui.richText.clearFormat')"
        @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
      >
        <Icon name="mdi:format-clear" class="w-4 h-4" />
      </button>

      <div class="rte-spacer" />

      <button
        type="button"
        class="rte-btn"
        :disabled="!editor.can().chain().focus().undo().run()"
        :title="$t('ui.richText.undo')"
        @click="editor.chain().focus().undo().run()"
      >
        <Icon name="mdi:undo" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="rte-btn"
        :disabled="!editor.can().chain().focus().redo().run()"
        :title="$t('ui.richText.redo')"
        @click="editor.chain().focus().redo().run()"
      >
        <Icon name="mdi:redo" class="w-4 h-4" />
      </button>
    </div>

    <!-- Editör alanı -->
    <EditorContent :editor="editor" class="rte-content" />

    <!-- Footer / hint -->
    <div class="rte-footer">
      <span class="rte-hint">
        <Icon name="mdi:information-outline" class="w-3 h-3" />
        {{ $t('ui.richText.pasteHint') }}
      </span>
      <span v-if="charCount" class="rte-count">{{ $t('ui.richText.charCount', { count: charCount.toLocaleString('tr-TR') }) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorFocused = ref(false)

/**
 * Word-paste temizleyici. Microsoft Word HTML'i mso-* CSS sınıfları,
 * <o:p> elementleri, conditional comment ve dev miktarda inline style ile gelir.
 * TipTap'in default paste handler'ı çoğunu strip eder ama bazı kalıntılar kalır —
 * bunları ek olarak temizliyoruz.
 */
const transformPastedHTML = (html: string): string => {
  return html
    // MS Office conditional comments
    .replace(/<!--\[if[\s\S]*?endif\]-->/gi, '')
    // <o:p>, <w:*>, <m:*> namespace elemanları
    .replace(/<\/?(o|w|m|v):[^>]*>/gi, '')
    // mso-* style özellikleri
    .replace(/\s*mso-[^:;"]+:[^;"]+;?/gi, '')
    // class="MsoNormal" gibi MS class'ları
    .replace(/\sclass="?Mso[^"\s>]*"?/gi, '')
    // Boş <span style=""> kalıntıları
    .replace(/<span\s*style=""\s*>/gi, '<span>')
    // Word'ün eklediği "font-family: ...; font-size: ..." inline style'lar — UI'da kendi tipografimiz var
    .replace(/\sstyle="[^"]*"/gi, '')
    // Birden fazla boş paragraf
    .replace(/(<p>\s*(&nbsp;)?\s*<\/p>\s*){2,}/gi, '<p></p>')
}

/**
 * Yapıştırılan düz metin bir HTML dokümanının kaynak kodu mu?
 * (Kullanıcı bir HTML şablonunu kod olarak kopyalayıp yapıştırabiliyor —
 * bu durumda kodu satır satır metin olarak değil, render edilmiş içerik
 * olarak eklemek istiyoruz.)
 */
const looksLikeHtmlSource = (text: string): boolean => {
  const t = text.trim()
  if (/^<!doctype\s+html/i.test(t) || /^<html[\s>]/i.test(t)) return true
  // Doküman başlığı yoksa bile gövdesi bariz HTML olan yapıştırmaları yakala
  return /<(p|div|h[1-6]|ul|ol|table|section|article)[\s>]/i.test(t)
    && /<\/(p|div|h[1-6]|ul|ol|table|section|article)>/i.test(t)
}

/** HTML kaynak kodundan sadece gövde içeriğini çıkar (style/script/head atılır). */
const extractBodyHtml = (source: string): string => {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  doc.querySelectorAll('style, script, link, meta, title').forEach(el => el.remove())
  return doc.body.innerHTML
}

const editor = new Editor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      // Code/codeBlock/blockquote'a şu an gerek yok — kontrolu sade tut
      codeBlock: false,
      code: false,
      blockquote: false,
      horizontalRule: false
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' }
    })
  ],
  editorProps: {
    transformPastedHTML,
    handlePaste: (_view, event) => {
      const text = event.clipboardData?.getData('text/plain') ?? ''
      if (!looksLikeHtmlSource(text)) return false
      event.preventDefault()
      const body = transformPastedHTML(extractBodyHtml(text))
      editor.chain().focus().insertContent(body, {
        parseOptions: { preserveWhitespace: false }
      }).run()
      return true
    },
    attributes: {
      class: 'rte-prose',
      'data-placeholder': props.placeholder ?? t('ui.richText.placeholder')
    }
  },
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    // TipTap boş editor için <p></p> üretir — onu boş string'e çeviriyoruz ki
    // form validation "required" doğru çalışsın.
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
  onFocus: () => { editorFocused.value = true },
  onBlur:  () => { editorFocused.value = false }
})

// Dışarıdan modelValue değişirse (örn. "Yeni Versiyon Olarak Kopyala" prefill)
// editör içeriğini güncelle — ama editör zaten o içerikteyse no-op.
watch(() => props.modelValue, (newVal) => {
  const current = editor.getHTML()
  const target  = newVal || ''
  if (current === target) return
  if (current === '<p></p>' && target === '') return
  editor.commands.setContent(target, false)
})

const charCount = computed(() => editor?.state?.doc?.textContent?.length ?? 0)

const promptLink = () => {
  const prev = editor.getAttributes('link').href ?? ''
  const url  = window.prompt(t('ui.richText.linkPrompt'), prev)
  if (url === null) return                // iptal
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  // Basit protokol kontrolü — javascript: vb. engelle
  const safe = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`
  editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run()
}

onBeforeUnmount(() => editor?.destroy())
</script>

<style scoped>
.rich-editor {
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  transition: all .15s;
  overflow: hidden;
  display: flex; flex-direction: column;
}
.rich-editor--focused {
  border-color: #4338ca;
  box-shadow: 0 0 0 3px rgba(67,56,202,0.1);
}

/* ─── Toolbar ─────────────────────────────────────────────────────────── */
.rte-toolbar {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.rte-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px;
  background: transparent; border: none;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  transition: all .12s;
  font-family: inherit;
}
.rte-btn:hover:not(:disabled) { background: #e2e8f0; color: #0f172a; }
.rte-btn:disabled { opacity: .35; cursor: not-allowed; }
.rte-btn--active { background: #e0e7ff !important; color: #4338ca !important; }
.rte-h { font-weight: 800; font-size: 12px; }
.rte-sep { width: 1px; height: 18px; background: #cbd5e1; margin: 0 4px; }
.rte-spacer { flex: 1; min-width: 4px; }

/* ─── Footer ──────────────────────────────────────────────────────────── */
.rte-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
  padding: 6px 12px;
  background: #fbfcfd;
  border-top: 1px solid #f1f5f9;
  font-size: 0.7rem;
  color: #94a3b8;
}
.rte-hint { display: inline-flex; align-items: center; gap: 4px; }
.rte-count { font-weight: 600; }
</style>

<!-- Editor content stilleri scoped olmamalı — TipTap render edilen DOM Vue scope dışında -->
<style>
.rte-content {
  padding: 14px 16px;
  min-height: 280px;
  max-height: 50vh;
  overflow-y: auto;
  background: white;
}
.rte-content:focus-within { outline: none; }

.rte-prose {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: #1e293b;
  outline: none;
}
.rte-prose:focus { outline: none; }

/* Boş editor için placeholder */
.rte-prose p.is-editor-empty:first-child::before,
.rte-prose > p:only-child:empty::before {
  content: attr(data-placeholder);
  color: #cbd5e1;
  pointer-events: none;
  float: left;
  height: 0;
}

/* Tipografi */
.rte-prose p { margin: 0 0 0.8em; }
.rte-prose p:last-child { margin-bottom: 0; }
.rte-prose h2 {
  font-size: 1.15rem; font-weight: 800; color: #0f172a;
  margin: 1.2em 0 0.5em; line-height: 1.3;
}
.rte-prose h3 {
  font-size: 1rem; font-weight: 700; color: #1e293b;
  margin: 1em 0 0.4em; line-height: 1.3;
}
.rte-prose strong { font-weight: 700; color: #0f172a; }
.rte-prose em { font-style: italic; }
.rte-prose u { text-decoration: underline; }

.rte-prose ul, .rte-prose ol {
  margin: 0.5em 0 0.8em;
  padding-left: 1.5em;
}
.rte-prose ul li, .rte-prose ol li { margin: 0.2em 0; }
.rte-prose ul { list-style: disc; }
.rte-prose ol { list-style: decimal; }
.rte-prose ul ul { list-style: circle; }
.rte-prose ul ul ul { list-style: square; }

.rte-prose a {
  color: #2563eb;
  text-decoration: underline;
  text-decoration-color: #93c5fd;
  text-underline-offset: 2px;
}
.rte-prose a:hover { text-decoration-color: #2563eb; }
</style>

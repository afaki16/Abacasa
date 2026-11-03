/**
 * Rich text içerik yardımcıları — RichTextDisplay ve PDF indirme gibi
 * içeriği render eden yerlerin ortak kullandığı mantık.
 */

/** İçerikte HTML etiketi var mı? (eski kayıtların bir kısmı düz metin olabilir.) */
export const hasHtmlTags = (s: string) => /<[a-z][\s\S]*?>/i.test(s)

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')

/** Metin bir HTML dokümanının kaynak kodu gibi mi görünüyor? */
const looksLikeHtmlSource = (s: string) =>
  /^\s*(<!doctype\s+html|<html[\s>])/i.test(s)

/**
 * Kaynak kod olarak saklanmış içeriği (kullanıcı bir HTML şablonunu editöre
 * kod olarak yapıştırmışsa) render edilebilir gövdeye çevirir. İki biçim olabilir:
 * ham kaynak (`<!DOCTYPE html>...`) veya editörün escape edip paragraflara
 * böldüğü hali (`<p>&lt;!DOCTYPE html&gt;</p>...`). Kaynak kod değilse null döner.
 */
export const recoverHtmlSource = (raw: string): string | null => {
  if (!import.meta.client) return null

  let source: string | null = null
  if (looksLikeHtmlSource(raw)) {
    source = raw
  } else {
    const tmp = document.createElement('div')
    tmp.innerHTML = raw
    const text = tmp.textContent ?? ''
    if (looksLikeHtmlSource(text)) source = text
  }
  if (!source) return null

  const doc = new DOMParser().parseFromString(source, 'text/html')
  doc.querySelectorAll('style, script, link, meta, title').forEach(el => el.remove())
  return doc.body.innerHTML
}

/**
 * DOMPurify allow-list — TipTap etiketleri + tablo/div (şablon yapıştırmaları için).
 * BACKEND İLE AYNI TUT: Backend/Abacasa.Application/Common/Sanitization/HtmlContentSanitizer.cs
 * (AllowedTags / AllowedAttributes). Listeler ayrışırsa editör önizlemesinde görünen öğeler
 * kaydedince sessizce kaybolur.
 */
export const RICH_TEXT_ALLOWED_TAGS = [
  'p', 'br', 'span', 'div',
  'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a'
]
export const RICH_TEXT_ALLOWED_ATTR = ['href', 'target', 'rel']

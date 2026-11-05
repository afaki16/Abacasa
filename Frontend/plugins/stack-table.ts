// v-stack-table: <table class="ui-table" v-stack-table> dar ekranda (≤640px) kart listesine döner.
// Başlık (thead th) metinleri her hücreye data-label olarak yazılır; CSS (global-admin.css, .ui-table--stack)
// etiketi hücrenin soluna koyar. Birden çok sütunu kaplayan hücre (colspan) ve başlığı boş sütun (işlemler) etiketsizdir.
const applyLabels = (table: HTMLTableElement) => {
  const heads = Array.from(table.querySelectorAll('thead th')).map(th =>
    (th.textContent ?? '').replace(/\s+/g, ' ').trim()
  )
  table.querySelectorAll('tbody tr, tfoot tr').forEach((row) => {
    let col = 0
    for (const cell of Array.from((row as HTMLTableRowElement).cells)) {
      const span = cell.colSpan || 1
      const label = span > 1 ? '' : (heads[col] ?? '')
      if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label)
      col += span
    }
  })
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive<HTMLTableElement>('stack-table', {
    mounted(el) {
      el.classList.add('ui-table--stack')
      applyLabels(el)
    },
    updated(el) {
      applyLabels(el)
    },
  })
})

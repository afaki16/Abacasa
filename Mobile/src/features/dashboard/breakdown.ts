// Kırılım satırları (kategori / ödeme aracı / kişi): pay ve yüzde etiketi. Saf; testlidir.

export interface BreakdownInput {
  key: string;
  label: string;
  amount: number;
}

export interface BreakdownRow extends BreakdownInput {
  /** 0–1; satırların (pozitif) toplamına oranı. */
  share: number;
  /** "39%" · sıfırdan büyük ama %1'in altındaysa "<1%". */
  percent: string;
}

/** Tutara göre azalan sıralar, payları hesaplar. Toplam sıfırsa paylar sıfır. */
export function toBreakdownRows(items: BreakdownInput[]): BreakdownRow[] {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.amount), 0);
  return [...items]
    .sort((a, b) => b.amount - a.amount)
    .map((item) => {
      const share = total > 0 ? Math.max(0, item.amount) / total : 0;
      const rounded = Math.round(share * 100);
      return { ...item, share, percent: share > 0 && rounded === 0 ? '<1%' : `${rounded}%` };
    });
}

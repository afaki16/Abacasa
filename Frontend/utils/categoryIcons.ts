// Kategori ikon anahtarları (backend CategoryIcons ile aynı liste; Material Icons adları) ve MDI karşılıkları.
// İkonu seçilmemiş kategoride addaki anahtar kelimeden tahmin edilir (mobil ile aynı kurallar).

export const CATEGORY_ICON_MDI: Record<string, string> = {
  'category': 'mdi-shape',
  'shopping-cart': 'mdi-cart',
  'shopping-bag': 'mdi-shopping',
  'restaurant': 'mdi-silverware-fork-knife',
  'local-cafe': 'mdi-coffee',
  'home': 'mdi-home',
  'receipt': 'mdi-receipt-text',
  'bolt': 'mdi-flash',
  'water-drop': 'mdi-water',
  'wifi': 'mdi-wifi',
  'smartphone': 'mdi-cellphone',
  'local-gas-station': 'mdi-gas-station',
  'directions-car': 'mdi-car',
  'directions-bus': 'mdi-bus',
  'flight': 'mdi-airplane',
  'school': 'mdi-school',
  'medical-services': 'mdi-medical-bag',
  'checkroom': 'mdi-hanger',
  'child-care': 'mdi-baby-face-outline',
  'pets': 'mdi-paw',
  'fitness-center': 'mdi-dumbbell',
  'celebration': 'mdi-party-popper',
  'movie': 'mdi-movie-open',
  'card-giftcard': 'mdi-gift',
  'volunteer-activism': 'mdi-hand-heart',
  'build': 'mdi-wrench',
  'savings': 'mdi-piggy-bank',
  'spa': 'mdi-spa',
}

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICON_MDI)

const GUESSES: [string[], string][] = [
  [['market', 'bakkal', 'grocer', 'süpermarket'], 'shopping-cart'],
  [['yakıt', 'benzin', 'mazot', 'akaryakıt', 'fuel', 'gas'], 'local-gas-station'],
  [['yemek', 'restoran', 'kafe', 'cafe', 'food', 'restaurant', 'lunch', 'dining'], 'restaurant'],
  [['eğitim', 'okul', 'kurs', 'kitap', 'education', 'school', 'book'], 'school'],
  [['sağlık', 'ilaç', 'hastane', 'eczane', 'doktor', 'health', 'medical', 'pharmacy'], 'medical-services'],
  [['ulaşım', 'ulasim', 'otobüs', 'metro', 'taksi', 'transport', 'bus', 'taxi'], 'directions-bus'],
  [['giyim', 'kıyafet', 'ayakkabı', 'clothing', 'clothes', 'shoes'], 'checkroom'],
  [['kira', 'konut', 'aidat', 'rent', 'housing'], 'home'],
  [['elektrik', 'enerji', 'electric'], 'bolt'],
  [['internet', 'telefon', 'gsm', 'phone'], 'wifi'],
  [['fatura', 'bill', 'su ', 'doğalgaz'], 'receipt'],
  [['araç', 'araba', 'car ', 'vehicle'], 'directions-car'],
  [['eğlence', 'sinema', 'oyun', 'tatil', 'entertainment', 'travel', 'holiday'], 'celebration'],
  [['çocuk', 'bebek', 'child', 'baby'], 'child-care'],
  [['evcil', 'kedi', 'köpek', 'pet'], 'pets'],
  [['bağış', 'sadaka', 'donation', 'charity'], 'volunteer-activism'],
  [['hediye', 'gift'], 'card-giftcard'],
  [['spor', 'sport', 'gym'], 'fitness-center'],
]

/** Kategorinin MDI ikonu: seçilen ikon, yoksa addan tahmin, o da yoksa genel ikon. */
export function categoryMdiIcon(icon: string | null | undefined, name?: string | null): string {
  if (icon && CATEGORY_ICON_MDI[icon]) return CATEGORY_ICON_MDI[icon]
  const lower = ` ${(name ?? '').toLocaleLowerCase('tr-TR')} `
  for (const [words, key] of GUESSES) {
    if (words.some((w) => lower.includes(w))) return CATEGORY_ICON_MDI[key]
  }
  return CATEGORY_ICON_MDI.category
}

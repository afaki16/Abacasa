// Liste ikonları. Kategorilerin backend'de ikonu yok: addaki anahtar kelimeye göre tahmin edilir,
// bulunamazsa genel kategori ikonu. Saf; testlidir.

import type { IconName } from '@/components/ui';
import type { PaymentMethodType } from '@/lib/domain/enums';

const CATEGORY_ICONS: [string[], IconName][] = [
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
];

export function categoryIcon(name: string | null | undefined): IconName {
  const lower = ` ${(name ?? '').toLocaleLowerCase('tr-TR')} `;
  for (const [words, icon] of CATEGORY_ICONS) {
    if (words.some((w) => lower.includes(w))) return icon;
  }
  return 'category';
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethodType, IconName> = {
  Cash: 'payments',
  BankAccount: 'account-balance',
  CreditCard: 'credit-card',
  MealCard: 'lunch-dining',
};

export function paymentMethodIcon(type: PaymentMethodType | null | undefined): IconName {
  return type ? PAYMENT_METHOD_ICONS[type] : 'credit-card';
}

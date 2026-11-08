// Yasal metinler web uygulamasındaki sayfalarda durur (tek kaynak: Frontend/pages/legal).
// Mobil bunları cihazın tarayıcısında açar; metin sürümleri backend'den gelir.

import * as Linking from 'expo-linking';

import { env } from '@/lib/config/env';

import type { ConsentDocument } from './types';

export const LEGAL_DOCUMENTS: Record<ConsentDocument, { title: string; path: string }> = {
  Terms: { title: 'Kullanım koşulları', path: '/legal/terms' },
  PrivacyNotice: { title: 'Aydınlatma metni', path: '/legal/privacy' },
};

export function openLegalDocument(document: ConsentDocument): Promise<true> {
  return Linking.openURL(`${env.webBaseUrl}${LEGAL_DOCUMENTS[document].path}`);
}

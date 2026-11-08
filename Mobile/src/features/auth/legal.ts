// Yasal metinler web uygulamasındaki sayfalarda durur (tek kaynak: Frontend/pages/legal).
// Mobil bunları cihazın tarayıcısında açar; metin sürümleri backend'den gelir.

import * as Linking from 'expo-linking';

import { env } from '@/lib/config/env';

import type { ConsentDocument } from './types';

/** titleKey: çeviri anahtarı, t(titleKey) ile gösterilir. */
export const LEGAL_DOCUMENTS: Record<ConsentDocument, { titleKey: string; path: string }> = {
  Terms: { titleKey: 'legal.terms', path: '/legal/terms' },
  PrivacyNotice: { titleKey: 'legal.privacyNotice', path: '/legal/privacy' },
};

export function openLegalDocument(document: ConsentDocument): Promise<true> {
  return Linking.openURL(`${env.webBaseUrl}${LEGAL_DOCUMENTS[document].path}`);
}

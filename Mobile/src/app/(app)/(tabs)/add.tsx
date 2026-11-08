import { Redirect } from 'expo-router';

/**
 * "Ekle" sekme yuvası. Sekme çubuğu buraya gezinmez (alttan sayfa açar); route yalnızca çubukta yer
 * tutsun diye var. Bağlantıyla doğrudan açılırsa Özet'e döner.
 */
export default function AddPlaceholder() {
  return <Redirect href="/" />;
}

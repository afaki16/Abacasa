import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

/**
 * Şifre değiştirme. Backend tüm cihazlardaki oturumları kapatır; bu cihazda yeni şifreyle
 * otomatik yeniden girilir. Yeniden giriş olmazsa guard login'e götürür (yönlendirme gerekmez).
 */
export default function ChangePasswordScreen() {
  return (
    <Screen scroll edges={['bottom']}>
      <Text muted>Şifren değişince diğer cihazlardaki oturumların kapanır.</Text>
      <ChangePasswordForm
        onSuccess={(reloggedIn) => {
          if (!reloggedIn) return;
          Alert.alert('Şifren değiştirildi', 'Diğer cihazlardaki oturumların kapatıldı.', [
            { text: 'Tamam', onPress: () => router.back() },
          ]);
        }}
      />
    </Screen>
  );
}

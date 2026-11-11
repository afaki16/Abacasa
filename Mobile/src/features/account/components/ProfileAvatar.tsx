import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/constants/theme';
import { env } from '@/lib/config/env';

import { resolveAvatarUrl, userInitials } from '../avatar';
import { InitialsAvatar } from './SettingsKit';

export interface ProfileAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  size?: number;
}

/**
 * Profil fotoğrafı; yoksa (ya da yüklenemezse) baş harfler. Düzenleme düğmesi ProfilePhotoEditor'da.
 */
export function ProfileAvatar({ firstName, lastName, profileImageUrl, size = 88 }: ProfileAvatarProps) {
  const styles = useStyles();
  const uri = resolveAvatarUrl(profileImageUrl, env.apiBaseUrl);
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (!uri || failedUri === uri) return <InitialsAvatar initials={userInitials(firstName, lastName)} size={size} />;
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        contentFit="cover"
        accessible={false}
        onError={() => setFailedUri(uri)}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  frame: { overflow: 'hidden', backgroundColor: c.iconTile },
}));

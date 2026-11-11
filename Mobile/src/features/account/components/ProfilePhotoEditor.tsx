import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { BottomSheet, Icon, ListItem } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';
import { toast } from '@/stores/toastStore';

import { useRemovePhoto, useUploadPhoto } from '../hooks';
import { preparePhoto } from '../photo';
import { ProfileAvatar, type ProfileAvatarProps } from './ProfileAvatar';

const SIZE = 88;

/**
 * Profil fotoğrafı + kamera düğmesi. Fotoğraf yoksa düğme doğrudan galeriyi açar; varsa "Fotoğraf seç / Kaldır"
 * menüsü çıkar. Galeri sistem seçicisidir (Android Photo Picker): depolama izni istenmez. Kare kırpılır.
 */
export function ProfilePhotoEditor(props: Omit<ProfileAvatarProps, 'size'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const upload = useUploadPhoto();
  const remove = useRemovePhoto();
  const [menuOpen, setMenuOpen] = useState(false);
  const busy = upload.isPending || remove.isPending;
  const hasPhoto = !!props.profileImageUrl;

  const pick = async () => {
    setMenuOpen(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const checked = preparePhoto(result.assets[0]);
    if (!checked.ok) {
      toast.error(t(`profileScreen.photo.${checked.errorKey}`));
      return;
    }
    upload.mutate(checked.part, {
      onSuccess: () => toast.success(t('profileScreen.photo.saved')),
      onError: (error) => toast.error(error.message),
    });
  };

  const removePhoto = () => {
    setMenuOpen(false);
    remove.mutate(undefined, {
      onSuccess: () => toast.success(t('profileScreen.photo.removed')),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <View style={styles.wrap}>
      <ProfileAvatar {...props} size={SIZE} />
      {busy ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
      <Pressable
        style={styles.camera}
        disabled={busy}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('profileScreen.photo.change')}
        onPress={() => (hasPhoto ? setMenuOpen(true) : void pick())}
      >
        <Icon name="photo-camera" size={18} color={colors.onPrimary} />
      </Pressable>

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('profileScreen.photo.title')}
        contentPadding={Spacing.sm}
      >
        <ListItem kind="menu" icon="photo-library" title={t('profileScreen.photo.choose')} onPress={() => void pick()} />
        <ListItem kind="menu" icon="delete" destructive last title={t('profileScreen.photo.remove')} onPress={removePhoto} />
      </BottomSheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { width: SIZE, height: SIZE },
  overlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

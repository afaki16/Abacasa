import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { FontFamily, makeStyles, useColors } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import { DefinitionRow, HeaderTextAction } from '@/features/categories/components/DefinitionKit';
import { DefinitionList } from '@/features/categories/components/DefinitionList';
import { PERSON_PERMISSIONS } from '@/features/people/constants';
import { usePeopleInfinite } from '@/features/people/hooks';
import { initials } from '@/features/people/relations';
import { personRoutes } from '@/features/people/routes';

/** Kişiler: harcama sahibi, bağış veren, alacaklı… Kullanımdaki kişi silinemez. */
export default function PeopleScreen() {
  return (
    <RequirePermission permission={PERSON_PERMISSIONS.READ}>
      <People />
    </RequirePermission>
  );
}

function People() {
  const { t } = useTranslation();
  const styles = useStyles();
  const colors = useColors();
  const canCreate = useHasPermission(PERSON_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(PERSON_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(PERSON_PERMISSIONS.DELETE);
  const query = usePeopleInfinite({});
  const add = () => router.push(personRoutes.new);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('people.title'),
          headerRight: canCreate
            ? () => <HeaderTextAction label={t('common.add')} onPress={add} />
            : undefined,
        }}
      />
      <DefinitionList
        query={query}
        emptyIcon="person"
        emptyTitle={t('people.emptyTitle')}
        emptyMessage={t('people.emptyMessage')}
        addLabel={canCreate ? t('people.add') : undefined}
        onAdd={canCreate ? add : undefined}
        renderRow={(item) => (
          <DefinitionRow
            leading={
              <View
                style={styles.avatar}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                <Text color={colors.primarySoftText} style={styles.initials}>
                  {initials(item.name)}
                </Text>
              </View>
            }
            title={item.name}
            subtitle={item.relation}
            onPress={
              canUpdate || canDelete ? () => router.push(personRoutes.edit(item.id)) : undefined
            }
          />
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: FontFamily.semibold, fontSize: 15, lineHeight: 20 },
}));

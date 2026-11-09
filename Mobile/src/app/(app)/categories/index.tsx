import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { makeStyles } from '@/constants/theme';
import { RequirePermission } from '@/features/auth/components/RequirePermission';
import { useHasPermission } from '@/features/auth/permissions';
import {
  DefinitionRow,
  HeaderTextAction,
  IconTile,
} from '@/features/categories/components/DefinitionKit';
import { DefinitionList } from '@/features/categories/components/DefinitionList';
import { CATEGORY_PERMISSIONS } from '@/features/categories/constants';
import { useCategoriesInfinite } from '@/features/categories/hooks';
import { categoryRoutes } from '@/features/categories/routes';
import { categoryIcon } from '@/features/expenses/icons';
import { plural } from '@/lib/i18n';

/** Kategoriler: harcama ve sabit ödemelerin kategorileri. Kullanımdaki kategori silinemez. */
export default function CategoriesScreen() {
  return (
    <RequirePermission permission={CATEGORY_PERMISSIONS.READ}>
      <Categories />
    </RequirePermission>
  );
}

function Categories() {
  const { t } = useTranslation();
  const styles = useStyles();
  const canCreate = useHasPermission(CATEGORY_PERMISSIONS.CREATE);
  const canUpdate = useHasPermission(CATEGORY_PERMISSIONS.UPDATE);
  const canDelete = useHasPermission(CATEGORY_PERMISSIONS.DELETE);
  const query = useCategoriesInfinite({});
  const add = () => router.push(categoryRoutes.new);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('categories.title'),
          headerRight: canCreate
            ? () => <HeaderTextAction label={t('common.add')} onPress={add} />
            : undefined,
        }}
      />
      <DefinitionList
        query={query}
        emptyIcon="category"
        emptyTitle={t('categories.emptyTitle')}
        emptyMessage={t('categories.emptyMessage')}
        addLabel={canCreate ? t('categories.add') : undefined}
        onAdd={canCreate ? add : undefined}
        renderRow={(item) => (
          <DefinitionRow
            leading={<IconTile icon={categoryIcon(item.name)} />}
            title={item.name}
            subtitle={item.usageCount !== undefined ? plural('categories.usage', item.usageCount) : null}
            onPress={
              canUpdate || canDelete ? () => router.push(categoryRoutes.edit(item.id)) : undefined
            }
          />
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.background },
}));

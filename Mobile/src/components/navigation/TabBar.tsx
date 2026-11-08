import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { FontFamily, makeStyles, Spacing, useColors } from '@/constants/theme';

/** Ortadaki "Ekle" düğmesinin route adı: ekrana gitmez, onAddPress çağrılır. */
export const ADD_ROUTE = 'add';

/** Sekme ikonları (tasarımdaki Material Symbols adlarının MaterialIcons karşılıkları). */
const ICONS: Record<string, IconName> = {
  index: 'space-dashboard',
  expenses: 'receipt-long',
  recurring: 'event-repeat',
  more: 'menu',
};

export interface TabBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

/**
 * Alt sekme çubuğu (TabBar): 5 yuva — Özet, Harcamalar, ortada yükseltilmiş "Ekle", Sabit ödemeler, Diğer.
 * Etiketler iki satıra sarılabilir (İngilizce). Etkin sekme ana renkte ve kalın.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets, onAddPress }: TabBarProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const focused = state.index === index;

        if (route.name === ADD_ROUTE) {
          return (
            <View key={route.key} style={[styles.slot, styles.addSlot]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={options.tabBarAccessibilityLabel}
                onPress={onAddPress}
                style={({ pressed }) => [styles.addButton, pressed && styles.addPressed]}
              >
                <Icon name="add" size={30} color={colors.onPrimary} />
              </Pressable>
              <Text style={styles.addLabel} numberOfLines={2}>
                {label}
              </Text>
            </View>
          );
        }

        const color = focused ? colors.primary : colors.tabInactive;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
            style={({ pressed }) => [styles.slot, styles.tab, pressed && styles.pressed]}
          >
            <Icon name={ICONS[route.name] ?? 'circle'} size={24} color={color} />
            <Text color={color} style={[styles.label, focused && styles.labelActive]} numberOfLines={2}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 6,
    paddingHorizontal: Spacing.xs,
    backgroundColor: c.tabBar,
    borderTopWidth: 1,
    borderTopColor: c.tabBarBorder,
  },
  slot: { flex: 1, alignItems: 'center', gap: 2 },
  tab: { minHeight: 50, paddingTop: Spacing.xs },
  label: { fontFamily: FontFamily.medium, fontSize: 11, lineHeight: 13, textAlign: 'center' },
  labelActive: { fontFamily: FontFamily.semibold },
  pressed: { opacity: 0.6 },
  addSlot: { marginTop: -10 },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.primary,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  addPressed: { backgroundColor: c.primaryPressed },
  addLabel: { fontFamily: FontFamily.semibold, fontSize: 11, lineHeight: 13, textAlign: 'center' },
}));

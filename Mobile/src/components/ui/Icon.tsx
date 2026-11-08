import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';

import { useColors } from '@/constants/theme';

/**
 * Tasarımdaki "Material Symbols Rounded" adlarının MaterialIcons karşılıkları (snake_case → kebab-case):
 * shopping_cart → shopping-cart. Dolu/boş ayrımı MaterialIcons'ta ayrı glif adıyla yapılır.
 */
export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  /** Verilmezse metin rengi. */
  color?: string;
}

/** Dekoratif ikon; erişilebilirlik ağacında görünmez (anlamı yanındaki metin ya da etiket verir). */
export function Icon({ name, size = 22, color }: IconProps) {
  const colors = useColors();
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={color ?? colors.text}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

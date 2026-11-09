import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, Spacing, useColors } from '@/constants/theme';

import { evaluatePasswordRules } from '../passwordRules';

export interface PasswordRulesProps {
  password: string;
  /** compact: iki sütun (kayıt) · list: alt alta (yeni şifre). */
  layout?: 'compact' | 'list';
}

/** Canlı şifre kuralları: sağlanan kural yeşil dolu onay, sağlanmayan boş daire (yalnızca renge bağlı değil). */
export function PasswordRules({ password, layout = 'list' }: PasswordRulesProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = useStyles();
  const rules = evaluatePasswordRules(password);
  const compact = layout === 'compact';

  return (
    <View style={[styles.container, compact && styles.grid]} accessibilityLabel={t('authScreens.passwordRules.label')}>
      {rules.map((rule) => {
        const label = t(rule.labelKey);
        // Yeşil metin için rozet tonu: düz success küçük yazıda yeterli kontrast vermiyor.
        const color = rule.met ? colors.badges.paid.fg : colors.placeholder;
        return (
          <View
            key={rule.key}
            style={[styles.rule, compact && styles.half]}
            accessible
            accessibilityLabel={t(rule.met ? 'authScreens.passwordRules.met' : 'authScreens.passwordRules.unmet', {
              rule: label,
            })}
          >
            <Icon name={rule.met ? 'check-circle' : 'radio-button-unchecked'} size={compact ? 16 : 17} color={color} />
            <Text variant={compact ? 'caption' : 'label'} color={color}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { gap: Spacing.xs, paddingTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.xs },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  half: { width: '50%' },
}));

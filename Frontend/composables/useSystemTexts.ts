// Veritabanında tohumlanan rol ve izin açıklamalarının çevirisi (systemTexts.*).
// Yalnızca açıklama tohumdaki metinle aynıysa çevrilir; yöneticinin elle yazdığı açıklama olduğu gibi gösterilir.
const SEEDED_ROLE_DESCRIPTIONS: Record<string, string> = {
  SuperAdmin: 'System super administrator with full access including sensitive operations',
  Admin: 'System administrator with full access',
  User: 'Standard authenticated user. No management permissions by default. Derived projects should add domain-specific permissions as needed.',
  HouseholdAdmin: 'Hane yöneticisi',
  HouseholdMember: 'Hane üyesi'
}

const PERMISSION_ACTIONS = ['Read', 'Create', 'Update', 'Delete']

export const useSystemTexts = () => {
  const { t, te } = useI18n()

  const roleDescription = (role: { name?: string | null; description?: string | null } | null | undefined): string => {
    const description = role?.description ?? ''
    const name = role?.name ?? ''
    if (name && SEEDED_ROLE_DESCRIPTIONS[name] === description) return t(`systemTexts.roles.${name}`)
    return description
  }

  // İzin adı "Kaynak.İşlem"; tohum açıklaması "Can <işlem> <kaynak>" (küçük harf)
  const permissionDescription = (permission: { name?: string | null; description?: string | null } | null | undefined): string => {
    const description = permission?.description ?? ''
    const [resource, action] = (permission?.name ?? '').split('.')
    if (!resource || !action || !PERMISSION_ACTIONS.includes(action)) return description
    if (description !== `Can ${action.toLowerCase()} ${resource.toLowerCase()}`) return description
    if (!te(`systemTexts.resources.${resource}`)) return description
    return t(`systemTexts.permissionActions.${action}`, { resource: t(`systemTexts.resources.${resource}`) })
  }

  return { roleDescription, permissionDescription }
}

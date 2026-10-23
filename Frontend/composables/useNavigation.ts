  import type { NavigationItem } from '~/types'

  export const navigationItems: NavigationItem[] = [
    {
      title: 'sidebar.menu.dashboard',
      icon: 'mdi-view-dashboard',
      children: [
        {
           title: 'sidebar.menu.dashboard',
      icon: 'mdi-view-dashboard',
      to: '/dashboard',
        }

      ]
    },

    {
      title: 'sidebar.menu.userManagement',
      icon: 'mdi-account-group',
      children: [
        {
          title: 'sidebar.menu.users',
          icon: 'mdi-account-multiple',
          to: '/users',
          permission: 'Users.Read'
        },
        {
          title: 'sidebar.menu.tenants',
          icon: 'mdi-domain',
          to: '/tenants',
          roles: ['SuperAdmin']
        },
        {
          title: 'sidebar.menu.roles',
          icon: 'mdi-shield-account',
          to: '/roles',
          permission: 'Roles.Read'
        },
        {
          title: 'sidebar.menu.permissions',
          icon: 'mdi-key',
          to: '/permissions',
          permission: 'Permissions.Read'
        }
      ]
    },

    {
      title: 'sidebar.menu.budget',
      icon: 'mdi-wallet',
      children: [
        {
          title: 'sidebar.menu.expenses',
          icon: 'mdi-cash-minus',
          to: '/expenses',
          permission: 'Expenses.Read'
        },
        {
          title: 'sidebar.menu.donations',
          icon: 'mdi-hand-heart',
          to: '/donations',
          permission: 'Donations.Read'
        },
        {
          title: 'sidebar.menu.donationTargets',
          icon: 'mdi-target',
          to: '/donation-targets',
          permission: 'DonationTargets.Read'
        },
        {
          title: 'sidebar.menu.donationFunds',
          icon: 'mdi-safe',
          to: '/donation-funds',
          permission: 'DonationFunds.Read'
        },
        {
          title: 'sidebar.menu.recurringPayments',
          icon: 'mdi-calendar-sync',
          to: '/recurring-payments',
          permission: 'RecurringPayments.Read'
        },
        {
          title: 'sidebar.menu.debts',
          icon: 'mdi-hand-coin',
          to: '/debts',
          permission: 'Debts.Read'
        },
        {
          title: 'sidebar.menu.ledger',
          icon: 'mdi-table-large',
          to: '/ledger',
          permission: 'Ledger.Read'
        },
        {
          title: 'sidebar.menu.vehicles',
          icon: 'mdi-car',
          to: '/vehicles',
          permission: 'Vehicles.Read'
        }
      ]
    },

    {
      title: 'sidebar.menu.definitions',
      icon: 'mdi-format-list-bulleted-type',
      children: [
        {
          title: 'sidebar.menu.categories',
          icon: 'mdi-shape',
          to: '/categories',
          permission: 'Categories.Read'
        },
        {
          title: 'sidebar.menu.people',
          icon: 'mdi-account-heart',
          to: '/people',
          permission: 'People.Read'
        },
        {
          title: 'sidebar.menu.paymentMethods',
          icon: 'mdi-credit-card-multiple',
          to: '/payment-methods',
          permission: 'PaymentMethods.Read'
        }
      ]
    },

    {
      title: 'sidebar.menu.settings',
      icon: 'mdi-cog',
      to: '/settings',
      roles: ['Admin', 'SuperAdmin']
    }
  ]

  export const filterNavigationByPermissions = (
    items: NavigationItem[],
    hasPermission: (permission: string) => boolean,
    hasRole: (role: string) => boolean
  ): NavigationItem[] => {
    return items
      .map((item): NavigationItem | null => {
        // Check permission requirement
        if (item.permission && !hasPermission(item.permission)) return null
        // Check role requirement
        if (item.roles && !item.roles.some(role => hasRole(role))) return null
        // If item has children, filter recursively and return new object (do not mutate original)
        if (item.children) {
          const filteredChildren = filterNavigationByPermissions(item.children, hasPermission, hasRole)
          if (filteredChildren.length === 0) return null
          return { ...item, children: filteredChildren }
        }
        return { ...item }
      })
      .filter((item): item is NavigationItem => item !== null)
  } 
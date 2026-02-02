import { Role } from '../types/auth'

export type MenuItemType = 'route' | 'view' // 'route' para navegación, 'view' para vistas internas

export interface MenuItem {
  id: string // Identificador único
  type: MenuItemType
  path?: string // Para tipo 'route': ruta de navegación
  viewId?: string // Para tipo 'view': identificador de vista interna
  label: string
  icon: string
  roles: Role[] // Roles que pueden ver este item
  requiresExactMatch?: boolean // Si true, solo activa con path exacto
}

export const menuConfig: MenuItem[] = [
  // Admin routes
  {
    id: 'admin-resumen',
    type: 'route',
    path: '/admin',
    label: 'Resumen',
    icon: 'dashboard',
    roles: [Role.Administrador],
    requiresExactMatch: true, // Solo activo cuando es exactamente /admin
  },
  {
    id: 'admin-usuarios',
    type: 'route',
    path: '/admin/usuarios',
    label: 'Usuarios',
    icon: 'people',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-reportes',
    type: 'route',
    path: '/admin/reportes',
    label: 'Reportes',
    icon: 'description',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-logs',
    type: 'route',
    path: '/admin/logs',
    label: 'Logs',
    icon: 'history',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-zonas',
    type: 'route',
    path: '/admin/zonas-estaciones',
    label: 'Zonas',
    icon: 'location_on',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-configuracion',
    type: 'route',
    path: '/admin/configuracion',
    label: 'Configuración',
    icon: 'settings',
    roles: [Role.Administrador],
  },
  {
    id: 'admin-productos',
    type: 'route',
    path: '/admin/productos',
    label: 'Productos',
    icon: 'inventory_2',
    roles: [Role.Administrador],
  },
  {
    id: 'reporte-eficiencia',
    type: 'route',
    path: '/reporte-eficiencia',
    label: 'Eficiencia',
    icon: 'monitoring',
    roles: [Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion],
  },
  {
    id: 'reporte-vtas',
    type: 'route',
    path: '/reporte-vtas',
    label: 'Vtas',
    icon: 'bar_chart',
    roles: [Role.Administrador, Role.GerenteEstacion, Role.GerenteZona, Role.Direccion],
  },
  {
    id: 'revision-mensual',
    type: 'route',
    path: '/revision-mensual',
    label: 'Revisión Mensual',
    icon: 'fact_check',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'dashboard-financiero',
    type: 'route',
    path: '/dashboard-financiero',
    label: 'Control Financiero',
    icon: 'account_balance',
    roles: [Role.GerenteEstacion, Role.GerenteZona, Role.Direccion, Role.Administrador],
  },
  // GerenteEstacion views
  {
    id: 'gerente-estacion-dashboard',
    type: 'view',
    viewId: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-reportes',
    type: 'view',
    viewId: 'reportes',
    label: 'Mis Reportes',
    icon: 'description',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-nueva-captura',
    type: 'view',
    viewId: 'nuevaCaptura',
    label: 'Nueva Captura',
    icon: 'add',
    roles: [Role.GerenteEstacion],
  },
  {
    id: 'gerente-estacion-historial',
    type: 'view',
    viewId: 'historial',
    label: 'Historial',
    icon: 'history',
    roles: [Role.GerenteEstacion],
  },
  // GerenteZona views
  {
    id: 'gerente-zona-dashboard',
    type: 'view',
    viewId: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    roles: [Role.GerenteZona],
  },
  {
    id: 'gerente-zona-revision',
    type: 'view',
    viewId: 'revision',
    label: 'Revisión',
    icon: 'task_alt',
    roles: [Role.GerenteZona],
  },
  {
    id: 'gerente-zona-historial',
    type: 'view',
    viewId: 'historial',
    label: 'Historial',
    icon: 'history',
    roles: [Role.GerenteZona],
  },
  // Director views (solo tiene una vista)
  {
    id: 'director-resumen',
    type: 'view',
    viewId: 'resumen',
    label: 'Resumen',
    icon: 'dashboard',
    roles: [Role.Direccion],
  },
]

/**
 * Obtiene los items del menú filtrados por rol
 */
export function getMenuItemsForRole(role: Role): MenuItem[] {
  return menuConfig.filter((item) => item.roles.includes(role))
}

/**
 * Obtiene la configuración del header según el rol
 */
export function getHeaderConfigForRole(role: Role): {
  title: string
  icon: string
  roleLabel: string
} {
  const configs: Record<Role, { title: string; icon: string; roleLabel: string }> = {
    [Role.Administrador]: {
      title: 'Portal Administrador',
      icon: 'admin_panel_settings',
      roleLabel: 'Administrador',
    },
    [Role.GerenteEstacion]: {
      title: 'Portal Gerente de Estación',
      icon: 'storefront',
      roleLabel: 'Gerente de Estación',
    },
    [Role.GerenteZona]: {
      title: 'Portal Gerente de Zona',
      icon: 'location_on',
      roleLabel: 'Gerente de Zona',
    },
    [Role.Direccion]: {
      title: 'Portal Directivo',
      icon: 'analytics',
      roleLabel: 'Director',
    },
  }

  return configs[role] || configs[Role.Administrador]
}

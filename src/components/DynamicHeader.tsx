import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import TwoFactorSetupModal from './TwoFactorSetupModal'
import { getHeaderConfigForRole, getMenuItemsForRole } from '../config/menuConfig'
import { menusService, MenuItem } from '../services/menusService'
import { Role } from '../types/auth'

interface DynamicHeaderProps {
  // Para vistas internas (GerenteEstacion, GerenteZona)
  activeViewId?: string
  onViewChange?: (viewId: string) => void
}

export default function DynamicHeader({ activeViewId, onViewChange }: DynamicHeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)

  // ... rest of the code until return ...

  // Obtener menús desde la base de datos con fallback a menuConfig
  const { data: menuItemsFromDB = [], isLoading, error } = useQuery({
    queryKey: ['menus', user?.role],
    queryFn: async () => {
      if (!user?.role) return []
      try {
        return await menusService.getMenusByRole(user.role as Role)
      } catch (err) {
        console.error('Error al cargar menús desde BD, usando fallback:', err)
        // Fallback a menuConfig si falla la consulta
        const fallbackMenus = getMenuItemsForRole(user.role as Role)
        // Convertir MenuConfigItem a MenuItem
        return fallbackMenus.map((item) => ({
          id: item.id,
          menu_id: item.id,
          type: item.type,
          path: item.path || null,
          view_id: item.viewId || null,
          label: item.label,
          icon: item.icon,
          orden: 0,
          requiere_exact_match: item.requiresExactMatch || false,
          activo: true,
          roles: item.roles,
        }))
      }
    },
    enabled: !!user?.role,
  })

  // Usar menús de BD o fallback
  const menuItems: MenuItem[] = menuItemsFromDB

  // Debug: mostrar error si hay
  if (error) {
    console.error('Error al cargar menús:', error)
  }

  if (!user) return null

  const headerConfig = getHeaderConfigForRole(user.role)

  const handleMenuClick = (item: MenuItem) => {
    console.log('Menu clicked:', item)
    if (item.type === 'route' && item.path) {
      console.log('Navigating to:', item.path)
      navigate(item.path)
    } else if (item.type === 'view' && item.view_id) {
      if (onViewChange) {
        // Para dashboards con vistas internas (GerenteEstacion, GerenteZona)
        console.log('Changing view to:', item.view_id)
        onViewChange(item.view_id)
      } else {
        // Si no hay onViewChange (estamos en una ruta independiente), navegar al dashboard base con el viewId
        console.log('No onViewChange, navigating to dashboard with view:', item.view_id)
        
        // Mapear el rol a su dashboard base
        const roleToDashboard: Record<string, string> = {
          [Role.GerenteEstacion]: '/gerente-estacion',
          [Role.GerenteZona]: '/gerente-zona',
          [Role.Direccion]: '/director',
          [Role.Administrador]: '/admin',
        }

        const baseRoute = roleToDashboard[user.role] || '/login'

        if (user.role === Role.Administrador) {
          // Para Admin: convertir view_id a ruta específica
          const viewToRoute: Record<string, string> = {
            'historial': '/admin/historial',
            'reportes': '/admin/reportes',
            'dashboard': '/admin',
          }
          const route = viewToRoute[item.view_id] || `/admin/${item.view_id}`
          console.log('Navigating Admin view to route:', route)
          navigate(route)
        } else {
          // Para otros roles: volver al dashboard con el viewId en el estado
          console.log('Navigating to base route:', baseRoute, 'with view:', item.view_id)
          navigate(baseRoute, { state: { activeViewId: item.view_id } })
        }
      }
    } else {
      console.warn('Menu item has no valid path or view_id:', item)
    }
  }

  const isItemActive = (item: MenuItem): boolean => {
    if (item.type === 'route' && item.path) {
      if (item.requiere_exact_match) {
        return location.pathname === item.path
      }
      // Para rutas que son prefijos (como /admin), solo activar si es exacto o si no hay otra ruta más específica activa
      // Si la ruta es exactamente igual, está activa
      if (location.pathname === item.path) {
        return true
      }
      // Si la ruta comienza con el path, verificar que no haya otra ruta más específica que también coincida
      if (item.path && location.pathname.startsWith(item.path)) {
        // Verificar si hay otra ruta más específica que también coincida
        const moreSpecificRoute = menuItems.find(
          (otherItem) =>
            otherItem.type === 'route' &&
            otherItem.path &&
            otherItem.path !== item.path &&
            item.path &&
            otherItem.path.startsWith(item.path) &&
            location.pathname.startsWith(otherItem.path)
        )
        // Si hay una ruta más específica activa, esta no debería estar activa
        return !moreSpecificRoute
      }
      return false
    } else if (item.type === 'view' && item.view_id) {
      if (activeViewId !== undefined) {
        // Si el contenedor define una vista activa explícita (ej: Director),
        // usarla para marcar el menú activo aunque no exista onViewChange.
        return activeViewId === item.view_id
      } else if (onViewChange) {
        // Para dashboards con vistas internas
        return activeViewId === item.view_id
      } else if (item.view_id) {
        // Para Admin: verificar si la ruta actual coincide con la ruta mapeada del view_id
        const viewToRoute: Record<string, string> = {
          'historial': '/admin/historial',
          'reportes': '/admin/reportes',
          'dashboard': '/admin',
        }
        const route = viewToRoute[item.view_id] || `/admin/${item.view_id}`
        return location.pathname === route || location.pathname.startsWith(route + '/')
      }
    }
    return false
  }

  // Filtrar solo menús activos
  const activeMenuItems = menuItems.filter((item) => {
    if (!item.activo) return false
    
    // Si el menú es de tipo "view" y no hay onViewChange, aún mostrarlo para Admin
    // (se convertirá a navegación de ruta en handleMenuClick)
    if (item.type === 'view' && !onViewChange && !item.view_id) {
      console.warn(`Menú "${item.label}" es de tipo "view" pero no tiene view_id. Ocultando menú.`)
      return false
    }
    
    // Si el menú es de tipo "route" y no tiene path, no mostrarlo
    if (item.type === 'route' && !item.path) {
      console.warn(`Menú "${item.label}" es de tipo "route" pero no tiene path. Ocultando menú.`)
      return false
    }
    
    return true
  })

  // Debug: mostrar menús cargados (solo si no está cargando y hay items)
  if (!isLoading && activeMenuItems.length > 0) {
    console.log('Menu items loaded:', activeMenuItems.length, activeMenuItems)
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#e6e8eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#1173d4]/10 text-[#1173d4]">
            <span className="material-symbols-outlined text-3xl">{headerConfig.icon}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-[#111418] dark:text-white">
            {headerConfig.title}
          </h2>
        </div>
        <div className="flex-1"></div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#e6e8eb] dark:border-[#2a3642] bg-white dark:bg-[#1a2632] px-6 py-3 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#1173d4]/10 text-[#1173d4]">
          <span className="material-symbols-outlined text-3xl">{headerConfig.icon}</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-[#111418] dark:text-white">
          {headerConfig.title}
        </h2>
      </div>
      <nav className="hidden md:flex flex-1 justify-center gap-8">
        {activeMenuItems.map((item) => {
          const isActive = isItemActive(item)
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`text-sm font-medium leading-normal px-1 py-4 -my-4 transition-colors ${
                isActive
                  ? 'text-[#1173d4] font-bold border-b-2 border-[#1173d4]'
                  : 'text-[#111418] dark:text-slate-300 hover:text-[#1173d4]'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="flex items-center gap-4">
        <button className="group flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#f6f7f8] dark:bg-[#2a3642] hover:bg-gray-200 dark:hover:bg-[#364350] transition-colors">
          <span className="material-symbols-outlined text-[#111418] dark:text-white group-hover:scale-110 transition-transform">
            notifications
          </span>
        </button>
        <ThemeToggle />
        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none text-[#111418] dark:text-white">
              {user?.name}
            </p>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
              {headerConfig.roleLabel}
            </p>
          </div>
          <button
            onClick={() => setIs2FAModalOpen(true)}
            className="size-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="Seguridad / 2FA"
          >
            <span className="material-symbols-outlined">security</span>
          </button>
          <button
            onClick={logout}
            className="size-10 rounded-full bg-[#1173d4]/10 text-[#1173d4] flex items-center justify-center hover:bg-[#1173d4]/20 transition-colors"
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
      <TwoFactorSetupModal isOpen={is2FAModalOpen} onClose={() => setIs2FAModalOpen(false)} />
    </header>
  )
}


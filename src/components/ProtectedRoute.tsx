import { Navigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types/auth'
import { menusService, MenuItem } from '../services/menusService'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Role[]
  menuPath?: string
}

function normalizePath(path: string): string {
  if (!path) return '/'
  const trimmed = path.trim()
  if (!trimmed) return '/'
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const normalized = withSlash.replace(/\/+$/, '')
  return normalized || '/'
}

function hasMenuRouteAccess(items: MenuItem[], pathToCheck: string): boolean {
  const normalizedCurrent = normalizePath(pathToCheck)

  return items.some((item) => {
    if (!item.activo || item.type !== 'route' || !item.path) return false

    const normalizedMenuPath = normalizePath(item.path)
    const exact = Boolean(item.requiere_exact_match)

    if (exact) {
      return normalizedCurrent === normalizedMenuPath
    }

    return (
      normalizedCurrent === normalizedMenuPath ||
      normalizedCurrent.startsWith(`${normalizedMenuPath}/`)
    )
  })
}

export function ProtectedRoute({ children, allowedRoles, menuPath }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const location = useLocation()

  const shouldCheckMenu = Boolean(isAuthenticated && user?.role && menuPath)
  const pathObjetivo = menuPath || location.pathname

  const { data: menus = [], isLoading: isLoadingMenus, isError: menusError } = useQuery({
    queryKey: ['menus-by-role-protected-route', user?.role],
    queryFn: () => menusService.getMenusByRole(user!.role as Role),
    enabled: shouldCheckMenu,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (shouldCheckMenu && isLoadingMenus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (shouldCheckMenu && !menusError) {
    const menuAccess = hasMenuRouteAccess(menus, pathObjetivo)
    if (!menuAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
          </div>
        </div>
      )
    }
  } else if (user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}


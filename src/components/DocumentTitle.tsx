import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const routeTitles: Record<string, string> = {
  '/login': 'Inicio de Sesión - Portal Ejecutivo',
  '/admin': 'Resumen - Portal Administrativo',
  '/admin/usuarios': 'Gestión de Usuarios - Portal Administrativo',
  '/admin/reportes': 'Reportes - Portal Administrativo',
  '/admin/configuracion': 'Configuración - Portal Administrativo',
  '/admin/zonas-estaciones': 'Zonas y Estaciones - Portal Administrativo',
  '/gerente-estacion': 'Portal Gerente de Estación',
  '/gerente-zona': 'Portal Gerente de Zona',
  '/director': 'Portal Director',
  '/director/reportes': 'Reportes - Director',
  '/director/reportes/er': 'Reporte ER - Director',
  '/director/reportes/r': 'Reporte R - Director',
  '/director/reportes/conciliacion': 'Reporte Conciliación - Director',
}

export default function DocumentTitle() {
  const location = useLocation()

  useEffect(() => {
    const title = routeTitles[location.pathname] || 'Portal Ejecutivo'
    document.title = title
  }, [location.pathname])

  return null
}


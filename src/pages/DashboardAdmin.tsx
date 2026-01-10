import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { usuariosService } from '../services/usuariosService'
import { reportesService } from '../services/reportesService'
import { EstadoReporte } from '../types/reportes'
import AdminHeader from '../components/AdminHeader'

export default function DashboardAdmin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Obtener estadísticas
  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios'],
    queryFn: usuariosService.getUsuarios,
  })

  // Obtener reportes (ahora devuelve objeto paginado)
  const { data: reportesData } = useQuery({
    queryKey: ['reportes', 'dashboard'],
    queryFn: () => reportesService.getReportes(1, 1000), // Obtener muchos para estadísticas
  })

  // Asegurar que reportes sea siempre un array
  const reportes = Array.isArray(reportesData?.data) ? reportesData.data : []

  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Calcular estadísticas
  const totalUsuarios = usuarios.length
  const totalReportes = reportesData?.pagination?.total || reportes.length
  const reportesAprobados = reportes.filter((r) => r.estado === EstadoReporte.Aprobado).length
  const reportesPendientes = reportes.filter((r) => r.estado === EstadoReporte.Pendiente).length
  const totalEstaciones = estaciones.length

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Portal Administrativo" icon="admin_panel_settings" />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading & Actions */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Dashboard de Administración
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <p className="text-base font-normal">Resumen general del sistema</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/reportes')}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#1a2632] px-4 py-2.5 text-sm font-bold text-[#111418] dark:text-white shadow-sm hover:bg-gray-50 dark:hover:bg-[#253240] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              <span>Filtros</span>
            </button>
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="mb-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1 - Total Usuarios */}
          <div className="group relative overflow-hidden rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2 text-[#1173d4]">
                <span className="material-symbols-outlined">people</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Activos
              </span>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total de Usuarios</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#111418] dark:text-white">{totalUsuarios}</p>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full bg-[#1173d4]" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* KPI 2 - Total Reportes */}
          <div className="group relative overflow-hidden rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-purple-50 dark:bg-purple-900/30 p-2 text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined">description</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                <span className="material-symbols-outlined text-sm">assessment</span>
                {totalReportes}
              </span>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total de Reportes</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#111418] dark:text-white">{totalReportes}</p>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* KPI 3 - Reportes Aprobados */}
          <div className="group relative overflow-hidden rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {reportesAprobados}
              </span>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Reportes Aprobados</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#111418] dark:text-white">
              {totalReportes > 0 ? Math.round((reportesAprobados / totalReportes) * 100) : 0}%
            </p>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${totalReportes > 0 ? (reportesAprobados / totalReportes) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* KPI 4 - Estaciones Activas */}
          <div className="group relative overflow-hidden rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-2 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-bold text-green-700 dark:text-green-400">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {totalEstaciones}
              </span>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Estaciones Activas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-[#111418] dark:text-white">{totalEstaciones}</p>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full bg-orange-500" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions Card */}
          <div className="lg:col-span-2 rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#111418] dark:text-white">Acciones Rápidas</h3>
                <p className="text-sm text-[#617589] dark:text-slate-400">Gestiona el sistema desde aquí</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/admin/usuarios')}
                className="group flex items-center gap-4 p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:border-[#1173d4] hover:bg-[#1173d4]/5 transition-all"
              >
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <span className="material-symbols-outlined text-[#1173d4] text-2xl">people</span>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-[#111418] dark:text-white">Gestión de Usuarios</h4>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Administrar usuarios y roles</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/reportes')}
                className="group flex items-center gap-4 p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:border-[#1173d4] hover:bg-[#1173d4]/5 transition-all"
              >
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                    bar_chart
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-[#111418] dark:text-white">Reportes y Estadísticas</h4>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Ver todos los reportes</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/configuracion')}
                className="group flex items-center gap-4 p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:border-[#1173d4] hover:bg-[#1173d4]/5 transition-all"
              >
                <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">
                    settings
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-[#111418] dark:text-white">Configuración</h4>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Ajustes del sistema</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/usuarios')}
                className="group flex items-center gap-4 p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 hover:border-[#1173d4] hover:bg-[#1173d4]/5 transition-all"
              >
                <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-2xl">
                    storefront
                  </span>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-[#111418] dark:text-white">Estaciones y Zonas</h4>
                  <p className="text-sm text-[#617589] dark:text-slate-400">Gestionar ubicaciones</p>
                </div>
              </button>
            </div>
          </div>

          {/* Status Summary Card */}
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Estado del Sistema</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-6">
              {/* Status Item 1 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#111418] dark:text-white flex items-center gap-2">
                    <span className="size-2 rounded-full bg-green-500"></span>
                    Reportes Aprobados
                  </span>
                  <span className="text-[#1173d4] font-bold">{reportesAprobados}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${totalReportes > 0 ? (reportesAprobados / totalReportes) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              {/* Status Item 2 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#111418] dark:text-white flex items-center gap-2">
                    <span className="size-2 rounded-full bg-orange-500"></span>
                    Pendientes
                  </span>
                  <span className="text-[#1173d4] font-bold">{reportesPendientes}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${totalReportes > 0 ? (reportesPendientes / totalReportes) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              {/* Status Item 3 */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-[#111418] dark:text-white flex items-center gap-2">
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    Usuarios Activos
                  </span>
                  <span className="text-[#1173d4] font-bold">{totalUsuarios}</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1173d4] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Usuarios Recientes</h3>
              <p className="text-sm text-[#617589] dark:text-slate-400">Últimos usuarios registrados</p>
            </div>
            <button
              onClick={() => navigate('/admin/usuarios')}
              className="text-sm font-bold text-[#1173d4] hover:underline"
            >
              Ver todos
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
              <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4" scope="col">
                    Usuario
                  </th>
                  <th className="px-6 py-4" scope="col">
                    Rol
                  </th>
                  <th className="px-6 py-4" scope="col">
                    Email
                  </th>
                  <th className="px-6 py-4 text-right" scope="col">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-4" scope="col"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700 border-t border-[#e6e8eb] dark:border-slate-700">
                {usuarios.slice(0, 5).map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                    <td className="px-6 py-4 font-medium text-[#111418] dark:text-white flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#1173d4]"></div>
                      {usuario.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                          usuario.role === 'Administrador'
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : usuario.role === 'GerenteEstacion'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : usuario.role === 'GerenteZona'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        }`}
                      >
                        {usuario.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{usuario.email}</td>
                    <td className="px-6 py-4 text-right font-display">
                      {new Date(usuario.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate('/admin/usuarios')}
                        className="text-[#1173d4] hover:text-blue-700 dark:hover:text-blue-400 font-bold text-xs"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {usuarios.length === 0 && (
            <div className="p-8 text-center text-[#617589] dark:text-slate-400">
              No hay usuarios registrados aún
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

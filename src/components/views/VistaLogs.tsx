import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../../services/reportesService'
import Paginacion from '../Paginacion'
import { useState } from 'react'
import { formatFechaHora, formatFechaSolo } from '../../utils/dateUtils'

interface LogEntry {
  id: string
  reporteId: string
  usuarioId: string
  usuarioNombre: string
  accion: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'CAMBIO_ESTADO'
  campoModificado?: string
  valorAnterior?: string
  valorNuevo?: string
  descripcion?: string
  fechaCambio: string
  estacionId?: string
  estacionNombre?: string
  reporteFecha?: string
}

interface VistaLogsProps {
  titulo?: string
  descripcion?: string
}

export default function VistaLogs({
  titulo = 'Logs del Sistema',
  descripcion = 'Registro de todas las acciones realizadas en el sistema',
}: VistaLogsProps) {
  const [page, setPage] = useState(1)
  const limit = 20

  // Estados para filtros
  const [filtroAccion, setFiltroAccion] = useState<string>('Todos')
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Construir filtros para la query
  const filters: any = {}
  if (filtroAccion !== 'Todos') filters.accion = filtroAccion
  if (filtroUsuario) filters.usuario = filtroUsuario
  if (filtroFechaDesde) filters.fechaDesde = filtroFechaDesde
  if (filtroFechaHasta) filters.fechaHasta = filtroFechaHasta
  if (busqueda) filters.busqueda = busqueda

  // Obtener logs con paginación
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', page, limit, filters],
    queryFn: () => reportesService.getAllLogs(page, limit, filters),
  })

  const logs: LogEntry[] = logsData?.data || []
  const pagination = logsData?.pagination || { page: 1, limit, total: 0, totalPages: 1 }

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear a página 1 cuando cambian los filtros
  const handleFiltroChange = () => {
    setPage(1)
  }

  const getAccionBadge = (accion: string) => {
    switch (accion) {
      case 'CREAR':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case 'ACTUALIZAR':
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case 'APROBAR':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'RECHAZAR':
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      case 'CAMBIO_ESTADO':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getAccionIcon = (accion: string) => {
    switch (accion) {
      case 'CREAR':
        return 'add_circle'
      case 'ACTUALIZAR':
        return 'edit'
      case 'APROBAR':
        return 'check_circle'
      case 'RECHAZAR':
        return 'cancel'
      case 'CAMBIO_ESTADO':
        return 'swap_horiz'
      default:
        return 'help'
    }
  }

  // Usar funciones utilitarias para formatear fechas con conversión correcta de UTC a zona horaria local

  return (
    <>
      {/* Page Heading */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            {titulo}
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">history</span>
            <p className="text-base font-normal">{descripcion}</p>
          </div>
        </div>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total de Logs</p>
              <p className="text-3xl font-black text-[#1173d4] dark:text-blue-400 mt-2">{pagination.total}</p>
              <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                {logs.length} en esta página
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-[#1173d4] dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Buscar</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value)
                  handleFiltroChange()
                }}
                placeholder="Usuario, acción, campo..."
                className="w-full pl-9 pr-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Acción</label>
            <select
              value={filtroAccion}
              onChange={(e) => {
                setFiltroAccion(e.target.value)
                handleFiltroChange()
              }}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              <option value="Todos">Todos</option>
              <option value="CREAR">Crear</option>
              <option value="ACTUALIZAR">Actualizar</option>
              <option value="APROBAR">Aprobar</option>
              <option value="RECHAZAR">Rechazar</option>
              <option value="CAMBIO_ESTADO">Cambio de Estado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Usuario</label>
            <input
              type="text"
              value={filtroUsuario}
              onChange={(e) => {
                setFiltroUsuario(e.target.value)
                handleFiltroChange()
              }}
              placeholder="Nombre de usuario..."
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Fecha Desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => {
                setFiltroFechaDesde(e.target.value)
                handleFiltroChange()
              }}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Fecha Hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => {
                setFiltroFechaHasta(e.target.value)
                handleFiltroChange()
              }}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
          <button
            onClick={() => {
              setFiltroAccion('Todos')
              setFiltroUsuario('')
              setFiltroFechaDesde('')
              setFiltroFechaHasta('')
              setBusqueda('')
              setPage(1)
            }}
            className="px-4 py-2 text-[#111418] dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">
            Registro de Actividades {pagination ? `(${pagination.total} total)` : ''}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">history</span>
            <p className="text-lg font-semibold mb-2">No se encontraron logs</p>
            <p className="text-sm">Ajusta los filtros para ver más resultados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f6f7f8] dark:bg-[#101922] border-b border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Estación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Fecha Reporte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Campo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#f6f7f8] dark:hover:bg-[#101922] transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111418] dark:text-white">
                        {formatFechaHora(log.fechaCambio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111418] dark:text-white">
                        {log.usuarioNombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getAccionBadge(
                            log.accion
                          )}`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {getAccionIcon(log.accion)}
                          </span>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111418] dark:text-white">
                        {log.estacionNombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#111418] dark:text-white">
                        {formatFechaSolo(log.reporteFecha)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418] dark:text-white">
                        {log.campoModificado ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{log.campoModificado}</span>
                            {log.valorAnterior && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Antes: {log.valorAnterior}
                              </span>
                            )}
                            {log.valorNuevo && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                Después: {log.valorNuevo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#617589] dark:text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#111418] dark:text-white max-w-xs">
                        {log.descripcion || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && (pagination.total > 0 || logs.length > 0) && (
              <Paginacion
                page={page}
                totalPages={pagination.totalPages || 1}
                totalItems={pagination.total || logs.length}
                itemsPerPage={pagination.limit || limit}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

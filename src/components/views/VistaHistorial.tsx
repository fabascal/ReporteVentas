import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../../types/reportes'
import { Role } from '../../types/auth'
import TablaReportes from '../TablaReportes'
import DetalleReporteModal from '../DetalleReporteModal'
import Paginacion from '../Paginacion'
import { useState } from 'react'

interface VistaHistorialProps {
  userRole: Role
  titulo?: string
  descripcion?: string
  onExportarExcel?: (reporte: ReporteVentas) => void
}

export default function VistaHistorial({ userRole, titulo = 'Historial de Reportes', descripcion = 'Reportes ya revisados y procesados', onExportarExcel }: VistaHistorialProps) {
  // Debug: verificar que la función se esté pasando
  console.log('VistaHistorial - onExportarExcel:', !!onExportarExcel)
  
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [reporteDetalle, setReporteDetalle] = useState<ReporteVentas | null>(null)
  const [page, setPage] = useState(1)
  const limit = 20

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | 'Todos'>('Todos')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Obtener reportes con paginación (el backend filtra según el rol y estado)
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', 'historial', userRole, page],
    queryFn: () => reportesService.getReportes(page, limit, 'Aprobado,Rechazado'),
  })

  const reportes = reportesData?.data || []
  const pagination = reportesData?.pagination || { page: 1, limit, total: 0, totalPages: 1 }

  // Filtrar reportes según el rol (el backend ya filtra, pero por seguridad)
  const reportesBase = reportes.filter((r) => {
    if (userRole === 'GerenteEstacion') {
      return r.estado === EstadoReporte.Aprobado || r.estado === EstadoReporte.Rechazado
    } else if (userRole === 'GerenteZona') {
      return r.estado === EstadoReporte.Aprobado || r.estado === EstadoReporte.Rechazado
    } else if (userRole === 'Administrador') {
      return r.estado === EstadoReporte.Aprobado || r.estado === EstadoReporte.Rechazado
    } else if (userRole === 'Direccion') {
      return r.estado === EstadoReporte.Aprobado
    }
    return false
  })

  // Aplicar filtros del lado del cliente sobre los datos paginados
  const reportesFiltrados = reportesBase.filter((reporte) => {
    if (filtroEstado !== 'Todos' && reporte.estado !== filtroEstado) return false
    if (filtroFechaDesde && reporte.fecha < filtroFechaDesde) return false
    if (filtroFechaHasta && reporte.fecha > filtroFechaHasta) return false
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      return (
        reporte.estacionNombre.toLowerCase().includes(busquedaLower) ||
        (reporte.creadoPor && reporte.creadoPor.toLowerCase().includes(busquedaLower)) ||
        reporte.id.toLowerCase().includes(busquedaLower)
      )
    }
    return true
  })

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear a página 1 cuando cambian los filtros
  const handleFiltroChange = () => {
    setPage(1)
  }

  // Contar aprobados y rechazados de la página actual (solo para referencia visual)
  // Nota: Estos son solo de la página actual, no el total general
  const aprobadosEnPagina = reportesFiltrados.filter((r) => r.estado === EstadoReporte.Aprobado).length
  const rechazadosEnPagina = reportesFiltrados.filter((r) => r.estado === EstadoReporte.Rechazado).length

  const calcularTotalVentas = (reporte: ReporteVentas) => {
    return reporte.premium.importe + reporte.magna.importe + reporte.diesel.importe + (reporte.aceites || 0)
  }

  const getEstadoBadge = (estado: EstadoReporte) => {
    switch (estado) {
      case EstadoReporte.Pendiente:
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case EstadoReporte.EnRevision:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case EstadoReporte.Aprobado:
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case EstadoReporte.Rechazado:
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getEstadoIcon = (estado: EstadoReporte) => {
    switch (estado) {
      case EstadoReporte.Pendiente:
        return 'schedule'
      case EstadoReporte.EnRevision:
        return 'hourglass_empty'
      case EstadoReporte.Aprobado:
        return 'check_circle'
      case EstadoReporte.Rechazado:
        return 'cancel'
      default:
        return 'help'
    }
  }

  const handleVerDetalle = (reporte: ReporteVentas) => {
    setReporteDetalle(reporte)
    setShowDetalleModal(true)
  }

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

      {/* KPI Cards - Mostrando total general y estadísticas de la página actual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total de Reportes</p>
              <p className="text-3xl font-black text-[#1173d4] dark:text-blue-400 mt-2">{pagination.total}</p>
              <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                {reportesFiltrados.length} en esta página
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-[#1173d4] dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Aprobados (página actual)</p>
              <p className="text-3xl font-black text-green-600 dark:text-green-400 mt-2">{aprobadosEnPagina}</p>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
          </div>
        </div>

        {userRole !== 'Direccion' && (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Rechazados (página actual)</p>
                <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-2">{rechazadosEnPagina}</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-3xl">cancel</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                placeholder="Estación, usuario, ID..."
                className="w-full pl-9 pr-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value as EstadoReporte | 'Todos')
                handleFiltroChange()
              }}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              <option value="Todos">Todos</option>
              <option value={EstadoReporte.Aprobado}>Aprobado</option>
              <option value={EstadoReporte.Rechazado}>Rechazado</option>
            </select>
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
              setFiltroEstado('Todos')
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

      {/* Tabla de Reportes */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">
            Reportes Procesados {pagination ? `(${pagination.total} total)` : ''}
            {reportesFiltrados.length !== reportesBase.length && ` - ${reportesFiltrados.length} filtrados`}
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">history</span>
            <p className="text-lg font-semibold mb-2">
              {reportes.length === 0 ? 'No hay reportes en el historial' : 'No se encontraron reportes con los filtros aplicados'}
            </p>
            <p className="text-sm">
              {reportes.length === 0
                ? 'Los reportes aprobados o rechazados aparecerán aquí'
                : 'Ajusta los filtros para ver más resultados'}
            </p>
          </div>
        ) : (
          <>
            <TablaReportes
              reportes={reportesFiltrados}
              calcularTotalVentas={calcularTotalVentas}
              getEstadoBadge={getEstadoBadge}
              getEstadoIcon={getEstadoIcon}
              handleVerDetalle={handleVerDetalle}
              showAcciones={true}
              renderAcciones={(reporte) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleVerDetalle(reporte)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1173d4] text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                    <span>Ver</span>
                  </button>
                  {onExportarExcel && (
                    <button
                      onClick={() => onExportarExcel(reporte)}
                      className="size-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Exportar a Excel"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  )}
                </div>
              )}
            />
            {pagination && (pagination.total > 0 || reportes.length > 0) && (
              <Paginacion
                page={page}
                totalPages={pagination.totalPages || 1}
                totalItems={pagination.total || reportes.length}
                itemsPerPage={pagination.limit || limit}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Modal de Detalle */}
      {showDetalleModal && reporteDetalle && (
        <DetalleReporteModal
          reporte={reporteDetalle}
          onClose={() => {
            setShowDetalleModal(false)
            setReporteDetalle(null)
          }}
          titulo={`Detalle del Reporte - ${reporteDetalle.estacionNombre}`}
        />
      )}
    </>
  )
}


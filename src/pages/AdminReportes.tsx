import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../types/reportes'
import AdminHeader from '../components/AdminHeader'
import TablaReportes from '../components/TablaReportes'
import DetalleReporteModal from '../components/DetalleReporteModal'
import ModalCambiarEstado from '../components/ModalCambiarEstado'
import Paginacion from '../components/Paginacion'
import { exportarReporteExcel } from '../utils/exportarExcel'

export default function AdminReportes() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Estados para paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | 'Todos'>('Todos')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteVentas | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [showEstadoModal, setShowEstadoModal] = useState(false)

  // Obtener reportes con paginación
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', 'admin', page, limit],
    queryFn: () => reportesService.getReportes(page, limit),
  })

  // Asegurar que reportes sea siempre un array
  const reportes = Array.isArray(reportesData?.data) ? reportesData.data : []
  const pagination = reportesData?.pagination

  // Obtener estaciones para filtros
  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Mutation para actualizar estado
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado, comentarios }: { id: string; estado: EstadoReporte; comentarios?: string }) =>
      reportesService.updateEstado(id, { estado, comentarios }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] })
      setShowEstadoModal(false)
      setReporteSeleccionado(null)
    },
  })

  // Filtrar reportes (filtros del lado del cliente sobre los datos paginados)
  const reportesFiltrados = reportes.filter((reporte) => {
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
    // Scroll al inicio de la tabla
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Resetear a página 1 cuando cambian los filtros
  const handleFiltroChange = () => {
    setPage(1)
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
    setReporteSeleccionado(reporte)
    setShowDetalleModal(true)
  }

  const handleCambiarEstado = (reporte: ReporteVentas) => {
    setReporteSeleccionado(reporte)
    setShowEstadoModal(true)
  }

  const calcularTotalVentas = (reporte: ReporteVentas) => {
    return reporte.premium.importe + reporte.magna.importe + reporte.diesel.importe + (reporte.aceites || 0)
  }

  const handleExportarExcel = (reporte: ReporteVentas) => {
    exportarReporteExcel(reporte)
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <AdminHeader title="Gestión de Reportes" icon="description" />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Gestión de Reportes
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">description</span>
              <p className="text-base font-normal">Visualiza, filtra y gestiona todos los reportes de ventas del sistema</p>
            </div>
          </div>
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
                <option value={EstadoReporte.Pendiente}>Pendiente</option>
                <option value={EstadoReporte.EnRevision}>En Revisión</option>
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
              Reportes {pagination ? `(${pagination.total} total)` : ''}
              {reportesFiltrados.length !== reportes.length && ` - ${reportesFiltrados.length} en esta página`}
            </h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="p-12 text-center text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4">description</span>
              <p className="text-lg font-semibold">No se encontraron reportes</p>
              <p className="text-sm">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <>
              <TablaReportes
                reportes={reportesFiltrados}
                calcularTotalVentas={calcularTotalVentas}
                getEstadoBadge={getEstadoBadge}
                getEstadoIcon={getEstadoIcon}
                handleVerDetalle={handleVerDetalle}
                handleCambiarEstado={handleCambiarEstado}
                showAcciones={true}
                showEditar={true}
                renderAcciones={(reporte) => (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleVerDetalle(reporte)}
                      className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Ver detalles"
                    >
                      <span className="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button
                      onClick={() => handleCambiarEstado(reporte)}
                      className="size-9 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Cambiar estado"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => handleExportarExcel(reporte)}
                      className="size-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Descargar reporte en Excel"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                )}
              />
              {pagination && pagination.totalPages > 1 && (
                <Paginacion
                  page={page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                  itemsPerPage={limit}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal Detalle Reporte */}
      {showDetalleModal && reporteSeleccionado && (
        <DetalleReporteModal
          reporte={reporteSeleccionado}
          onClose={() => {
            setShowDetalleModal(false)
            setReporteSeleccionado(null)
          }}
        />
      )}

      {/* Modal Cambiar Estado */}
      {showEstadoModal && reporteSeleccionado && (
        <CambiarEstadoModal
          reporte={reporteSeleccionado}
          onClose={() => {
            setShowEstadoModal(false)
            setReporteSeleccionado(null)
          }}
          onUpdate={(estado, comentarios) =>
            updateEstadoMutation.mutate({ id: reporteSeleccionado.id, estado, comentarios })
          }
          isLoading={updateEstadoMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal para ver detalle del reporte

// Modal para cambiar estado del reporte
function CambiarEstadoModal({
  reporte,
  onClose,
  onUpdate,
  isLoading,
}: {
  reporte: ReporteVentas
  onClose: () => void
  onUpdate: (estado: EstadoReporte, comentarios?: string) => void
  isLoading: boolean
}) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoReporte>(
    reporte.estado === EstadoReporte.Pendiente ? EstadoReporte.EnRevision : EstadoReporte.Aprobado
  )
  const [comentarios, setComentarios] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(nuevoEstado, comentarios || undefined)
  }

  return (
    <div className="fixed inset-0 bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Cambiar Estado del Reporte</h2>
          <button
            onClick={onClose}
            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Nuevo Estado *
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value as EstadoReporte)}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              required
            >
              <option value={EstadoReporte.EnRevision}>En Revisión</option>
              <option value={EstadoReporte.Aprobado}>Aprobado</option>
              <option value={EstadoReporte.Rechazado}>Rechazado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
              Comentarios (opcional)
            </label>
            <textarea
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent resize-none"
              placeholder="Agrega comentarios sobre la revisión..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#111418] dark:text-white bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-[#1173d4] text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Actualizar Estado</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

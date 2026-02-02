import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../types/reportes'
import { Role } from '../types/auth'
import GerenteEstacionHeader, { VistaActivaGerenteEstacion } from '../components/GerenteEstacionHeader'
import FormularioCapturaVentas from '../components/FormularioCapturaVentas'
import FormularioEditarReporte from '../components/FormularioEditarReporte'
import DetalleReporteModal from '../components/DetalleReporteModal'
import VistaHistorial from '../components/views/VistaHistorial'
import VistaReportes from '../components/views/VistaReportes'
import VistaDashboardGerenteEstacion from '../components/views/VistaDashboardGerenteEstacion'
import { exportarReporteExcel } from '../utils/exportarExcel'

export default function DashboardGerenteEstacion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const [vistaActiva, setVistaActiva] = useState<VistaActivaGerenteEstacion>('dashboard')
  const [selectedReporte, setSelectedReporte] = useState<ReporteVentas | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showEstadoModal, setShowEstadoModal] = useState(false)
  const [comentarios, setComentarios] = useState('')
  
  // Efecto para manejar el cambio de vista desde la navegación (state)
  useEffect(() => {
    if (location.state?.activeViewId) {
      setVistaActiva(location.state.activeViewId as VistaActivaGerenteEstacion)
    }
  }, [location.state])
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoReporte | 'Todos'>('Todos')
  const [filtroEstacion, setFiltroEstacion] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Obtener reportes con paginación según la vista activa
  let estadoFiltroBackend: string | undefined = undefined
  if (vistaActiva === 'historial') {
    estadoFiltroBackend = 'Aprobado,Rechazado'
  } else if (vistaActiva === 'reportes') {
    estadoFiltroBackend = 'Pendiente'
  }

  const estadoFiltroFinal = filtroEstado !== 'Todos' ? filtroEstado : estadoFiltroBackend

  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', vistaActiva, page, estadoFiltroFinal, filtroEstacion],
    queryFn: () => reportesService.getReportes(
      page, 
      limit, 
      estadoFiltroFinal,
      undefined,
      filtroEstacion || undefined
    ),
    enabled: vistaActiva !== 'nuevaCaptura',
  })

  const reportes = reportesData?.data || []
  const pagination = reportesData?.pagination || { page: 1, limit, total: 0, totalPages: 1 }

  // Obtener estaciones asignadas (el backend ya filtra según el usuario y rol)
  // Para GerenteEstacion, solo devuelve las estaciones asignadas al usuario
  const { data: todasEstaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Obtener todas las estaciones asignadas (sin filtrar por reportes, para que el dropdown siempre funcione)
  const estaciones = todasEstaciones

  // Los reportes ya vienen filtrados del backend, no necesitamos filtrar en el frontend
  const reportesFiltrados = reportes

  // Mutation para actualizar estado (autorizar)
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado, comentarios }: { id: string; estado: EstadoReporte; comentarios?: string }) =>
      reportesService.updateEstado(id, { estado, comentarios }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] })
      setShowEstadoModal(false)
      setSelectedReporte(null)
      setComentarios('')
      setPage(1)
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Error al actualizar el estado del reporte'
      alert(errorMessage)
    },
  })

  // Usar estadísticas del backend (totales globales, no solo de la página actual)
  const totalReportes = pagination.total

  const handleVerDetalle = (reporte: ReporteVentas) => {
    setSelectedReporte(reporte)
    setShowDetalleModal(true)
  }

  const handleEditar = (reporte: ReporteVentas) => {
    if (reporte.estado === EstadoReporte.Pendiente) {
      setSelectedReporte(reporte)
      setShowEditModal(true)
    }
  }

  const handleAprobarRechazar = (reporte: ReporteVentas) => {
    setSelectedReporte(reporte)
    setShowEstadoModal(true)
  }

  const handleConfirmarEstado = (estado: EstadoReporte) => {
    if (selectedReporte) {
      updateEstadoMutation.mutate({
        id: selectedReporte.id,
        estado,
        comentarios: comentarios || undefined,
      })
    }
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

  const handleExportarExcel = (reporte: ReporteVentas) => {
    exportarReporteExcel(reporte)
  }

  const calcularTotalVentas = (r: ReporteVentas) => {
    return (r.premium.importe || 0) + (r.magna.importe || 0) + (r.diesel.importe || 0) + (r.aceites || 0)
  }


  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <GerenteEstacionHeader vistaActiva={vistaActiva} onChangeVista={setVistaActiva} />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {vistaActiva === 'dashboard' ? (
          <VistaDashboardGerenteEstacion userRole={user?.role} />
        ) : vistaActiva === 'nuevaCaptura' ? (
          <div className="space-y-6">
            {/* Page Heading */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                  Captura de Venta Diaria
                </h1>
                <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                  <p className="text-base font-normal">Ingrese los detalles de la transacción para el cierre del día</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#617589] dark:text-slate-400 bg-white dark:bg-[#1a2632] px-4 py-2 rounded-full border border-[#e6e8eb] dark:border-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>
                  Hoy: <span className="font-semibold text-[#111418] dark:text-white">{new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>

            {/* Formulario */}
            <FormularioCapturaVentas
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['reportes'] })
                setVistaActiva('reportes')
                setPage(1) // Resetear a página 1 después de crear
              }}
              onCancel={() => setVistaActiva('reportes')}
            />
          </div>
        ) : vistaActiva === 'historial' ? (
          <VistaHistorial
            userRole={user?.role || Role.GerenteEstacion}
            estadoFiltro="Aprobado,Rechazado"
            onExportarExcel={handleExportarExcel}
          />
        ) : (
          <VistaReportes
            reportes={reportes}
            reportesFiltrados={reportesFiltrados}
            isLoading={isLoading}
            totalReportes={pagination.total}
            reportesPendientes={reportesData?.stats?.pendientes || 0}
            reportesEnRevision={reportesData?.stats?.enRevision || 0}
            reportesRechazados={reportesData?.stats?.rechazados || 0}
            filtroEstado={filtroEstado}
            setFiltroEstado={(estado) => {
              setFiltroEstado(estado)
              setPage(1)
            }}
            filtroEstacion={filtroEstacion}
            setFiltroEstacion={(estacion) => {
              setFiltroEstacion(estacion)
              setPage(1) // Resetear a página 1 al cambiar filtro
            }}
            estaciones={estaciones}
            getEstadoBadge={getEstadoBadge}
            getEstadoIcon={getEstadoIcon}
            calcularTotalVentas={calcularTotalVentas}
            handleVerDetalle={handleVerDetalle}
            handleEditar={handleEditar}
            handleAprobarRechazar={handleAprobarRechazar}
            handleExportarExcel={handleExportarExcel}
            onNuevoReporte={() => setVistaActiva('nuevaCaptura')}
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </main>

      {/* Modal de Detalle */}
      {showDetalleModal && selectedReporte && (
        <DetalleReporteModal
          reporte={selectedReporte}
          onClose={() => {
            setShowDetalleModal(false)
            setSelectedReporte(null)
          }}
          onExportar={() => handleExportarExcel(selectedReporte)}
          titulo={`Detalle del Reporte - ${selectedReporte.estacionNombre}`}
        />
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedReporte && (
        <FormularioEditarReporte
          reporte={selectedReporte}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['reportes'] })
            setShowEditModal(false)
            setSelectedReporte(null)
          }}
          onCancel={() => {
            setShowEditModal(false)
            setSelectedReporte(null)
          }}
        />
      )}

      {/* Modal de Aprobar/Rechazar */}
      {showEstadoModal && selectedReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
              <h3 className="text-lg font-bold text-[#111418] dark:text-white">Aprobar o Rechazar Reporte</h3>
              <button
                onClick={() => {
                  setShowEstadoModal(false)
                  setSelectedReporte(null)
                  setComentarios('')
                }}
                className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-[#617589] dark:text-slate-400 mb-2">
                  Estación: <span className="font-semibold text-[#111418] dark:text-white">{selectedReporte.estacionNombre}</span>
                </p>
                <p className="text-sm text-[#617589] dark:text-slate-400">
                  Fecha: <span className="font-semibold text-[#111418] dark:text-white">
                    {new Date(selectedReporte.fecha).toLocaleDateString('es-MX')}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                  Comentarios (opcional)
                </label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white p-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Agregar comentarios sobre la aprobación o rechazo..."
                />
              </div>

              {updateEstadoMutation.isError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    <p className="font-medium">
                      {updateEstadoMutation.error instanceof Error
                        ? updateEstadoMutation.error.message
                        : 'Error al actualizar el estado del reporte'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleConfirmarEstado(EstadoReporte.Aprobado)}
                  disabled={updateEstadoMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Aprobar
                </button>
                <button
                  onClick={() => handleConfirmarEstado(EstadoReporte.Rechazado)}
                  disabled={updateEstadoMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  Rechazar
                </button>
                <button
                  onClick={() => {
                    setShowEstadoModal(false)
                    setSelectedReporte(null)
                    setComentarios('')
                  }}
                  disabled={updateEstadoMutation.isPending}
                  className="px-4 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}


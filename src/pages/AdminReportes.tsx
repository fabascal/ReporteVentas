import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportesService } from '../services/reportesService'
import { ReporteVentas } from '../types/reportes'
import AdminHeader from '../components/AdminHeader'
import TablaReportes from '../components/TablaReportes'
import DetalleReporteModal from '../components/DetalleReporteModal'
import Paginacion from '../components/Paginacion'
import { exportarReporteExcel } from '../utils/exportarExcel'

export default function AdminReportes() {
  const navigate = useNavigate()

  // Estados para paginación
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Estados para filtros
  const [filtroEstacion, setFiltroEstacion] = useState<string>('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteVentas | null>(null)
  const [showDetalleModal, setShowDetalleModal] = useState(false)

  // Obtener reportes con paginación y filtros (todos los filtros se envían al backend)
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', 'admin', page, limit, busqueda, filtroEstacion, filtroFechaDesde, filtroFechaHasta],
    queryFn: () => reportesService.getReportes(
      page, 
      limit, 
      undefined, 
      busqueda, 
      filtroEstacion || undefined,
      filtroFechaDesde || undefined,
      filtroFechaHasta || undefined
    ),
  })

  // Asegurar que reportes sea siempre un array
  const reportes = Array.isArray(reportesData?.data) ? reportesData.data : []
  const pagination = reportesData?.pagination

  // Obtener estaciones para filtros
  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Los reportes ya vienen filtrados del servidor, no necesitamos filtrar en el frontend
  const reportesFiltrados = reportes

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

  const handleVerDetalle = (reporte: ReporteVentas) => {
    setReporteSeleccionado(reporte)
    setShowDetalleModal(true)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">Estación</label>
              <select
                value={filtroEstacion}
                onChange={(e) => {
                  setFiltroEstacion(e.target.value)
                  handleFiltroChange()
                }}
                className="w-full px-4 py-2 border border-[#dbe0e6] dark:border-slate-600 rounded-lg bg-white dark:bg-[#101922] text-[#111418] dark:text-white focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
              >
                <option value="">Todas las estaciones</option>
                {estaciones.map((estacion) => (
                  <option key={estacion.id} value={estacion.id}>
                    {estacion.nombre}
                  </option>
                ))}
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
                setFiltroEstacion('')
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
              Reportes {pagination ? `(${pagination.total} total, página ${page} de ${pagination.totalPages})` : ''}
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
                handleVerDetalle={handleVerDetalle}
                showAcciones={true}
              showEstado={false}
              showEditar={false}
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
                      onClick={() => handleExportarExcel(reporte)}
                      className="size-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title="Descargar reporte en Excel"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                )}
              />
              {pagination && pagination.totalPages > 0 && (
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

    </div>
  )
}

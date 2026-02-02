import React from 'react'
import { ReporteVentas, EstadoReporte } from '../../types/reportes'
import TablaReportes from '../TablaReportes'
import Paginacion from '../Paginacion'

interface VistaReportesProps {
  reportes: ReporteVentas[]
  reportesFiltrados: ReporteVentas[]
  isLoading: boolean
  totalReportes: number
  reportesPendientes: number
  reportesEnRevision: number
  reportesRechazados: number
  filtroEstado: EstadoReporte | 'Todos'
  setFiltroEstado: (estado: EstadoReporte | 'Todos') => void
  filtroEstacion: string
  setFiltroEstacion: (estacion: string) => void
  estaciones: Array<{ id: string; nombre: string }>
  getEstadoBadge: (estado: EstadoReporte) => string
  getEstadoIcon: (estado: EstadoReporte) => string
  calcularTotalVentas: (reporte: ReporteVentas) => number
  handleVerDetalle: (reporte: ReporteVentas) => void
  handleEditar: (reporte: ReporteVentas) => void
  handleAprobarRechazar: (reporte: ReporteVentas) => void
  handleExportarExcel: (reporte: ReporteVentas) => void
  onNuevoReporte: () => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
}

const VistaReportes: React.FC<VistaReportesProps> = ({
  reportes,
  reportesFiltrados,
  isLoading,
  totalReportes,
  reportesPendientes,
  reportesEnRevision,
  reportesRechazados,
  filtroEstado,
  setFiltroEstado,
  filtroEstacion,
  setFiltroEstacion,
  estaciones,
  getEstadoBadge,
  getEstadoIcon,
  calcularTotalVentas,
  handleVerDetalle,
  handleEditar,
  handleAprobarRechazar,
  handleExportarExcel,
  onNuevoReporte,
  pagination,
  onPageChange,
}) => {
  // Debug: verificar que la función se esté pasando
  console.log('VistaReportes - handleExportarExcel:', !!handleExportarExcel)
  return (
    <>
      {/* Page Heading */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Mis Reportes de Ventas
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">description</span>
            <p className="text-base font-normal">Visualiza y gestiona tus reportes de ventas</p>
          </div>
        </div>
        <button
          onClick={onNuevoReporte}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Nuevo Reporte</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total Reportes</p>
              <p className="text-3xl font-black text-[#111418] dark:text-white mt-2">{totalReportes}</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Pendientes</p>
              <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 mt-2">{reportesPendientes}</p>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-3 text-yellow-600 dark:text-yellow-400">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">En Revisión</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{reportesEnRevision}</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Rechazados</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-2">{reportesRechazados}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-3xl">cancel</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro por Estado */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400">filter_list</span>
            <label className="text-sm font-medium text-[#111418] dark:text-white">Estado:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoReporte | 'Todos')}
              className="px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              <option value="Todos">Todos</option>
              <option value={EstadoReporte.Pendiente}>Pendientes</option>
              <option value={EstadoReporte.Aprobado}>Aprobados</option>
              <option value={EstadoReporte.Rechazado}>Rechazados</option>
            </select>
          </div>

          {/* Filtro por Estación */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#617589] dark:text-slate-400">location_on</span>
            <label className="text-sm font-medium text-[#111418] dark:text-white">Estación:</label>
            <select
              value={filtroEstacion}
              onChange={(e) => setFiltroEstacion(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1173d4] focus:border-transparent min-w-[200px]"
            >
              <option value="">Todas las estaciones</option>
              {estaciones.map((estacion) => (
                <option key={estacion.id} value={estacion.id}>
                  {estacion.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contador de resultados filtrados */}
        <div className="text-sm text-[#617589] dark:text-slate-400">
          Mostrando <span className="font-semibold text-[#111418] dark:text-white">{reportesFiltrados.length}</span> de{' '}
          <span className="font-semibold text-[#111418] dark:text-white">{reportes.length}</span> reportes
        </div>
      </div>

      {/* Tabla de Reportes */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">Lista de Reportes</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
          </div>
        ) : reportes.length === 0 ? (
          <div className="p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">description</span>
            <p className="text-lg font-semibold mb-2">No hay reportes registrados</p>
            <p className="text-sm mb-4">Comienza creando tu primer reporte de ventas</p>
            <button
              onClick={onNuevoReporte}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Crear Primer Reporte</span>
            </button>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">filter_alt</span>
            <p className="text-lg font-semibold mb-2">No hay reportes que coincidan con los filtros</p>
            <p className="text-sm mb-4">Intenta ajustar los filtros para ver más resultados</p>
            <button
              onClick={() => {
                setFiltroEstado('Todos')
                setFiltroEstacion('')
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1173d4] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">clear_all</span>
              <span>Limpiar Filtros</span>
            </button>
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
              showEstado={true}
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
                    onClick={() => handleEditar(reporte)}
                    disabled={reporte.estado !== EstadoReporte.Pendiente}
                    className={`size-9 rounded-lg flex items-center justify-center transition-all ${
                      reporte.estado === EstadoReporte.Pendiente
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    title={reporte.estado === EstadoReporte.Pendiente ? 'Editar reporte' : 'Solo se pueden editar reportes pendientes'}
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => handleAprobarRechazar(reporte)}
                    disabled={reporte.estado !== EstadoReporte.Pendiente}
                    className={`size-9 rounded-lg flex items-center justify-center transition-all ${
                      reporte.estado === EstadoReporte.Pendiente
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                    title={reporte.estado === EstadoReporte.Pendiente ? 'Aprobar o Rechazar' : 'Solo se pueden aprobar o rechazar reportes pendientes'}
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </button>
                  <button
                    onClick={() => handleExportarExcel(reporte)}
                    className="size-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    title="Exportar a Excel"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                  </button>
                </div>
              )}
            />
            {pagination && pagination.totalPages > 1 && onPageChange && (
              <Paginacion
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(newPage) => {
                  onPageChange(newPage)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

export default VistaReportes


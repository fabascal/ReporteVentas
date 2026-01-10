import React from 'react'
import { ReporteVentas, EstadoReporte } from '../../types/reportes'
import TablaReportes from '../TablaReportes'
import Paginacion from '../Paginacion'

interface VistaRevisionProps {
  reportes: ReporteVentas[]
  isLoading: boolean
  totalEnRevision: number
  totalReportes: number
  getEstadoBadge: (estado: EstadoReporte) => string
  getEstadoIcon: (estado: EstadoReporte) => string
  calcularTotalVentas: (reporte: ReporteVentas) => number
  handleVerDetalle: (reporte: ReporteVentas) => void
  onExportarExcel?: (reporte: ReporteVentas) => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
}

const VistaRevision: React.FC<VistaRevisionProps> = ({
  reportes,
  isLoading,
  totalEnRevision,
  totalReportes,
  getEstadoBadge,
  getEstadoIcon,
  calcularTotalVentas,
  handleVerDetalle,
  onExportarExcel,
  pagination,
  onPageChange,
}) => {
  return (
    <>
      {/* Page Heading */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Revisión de Reportes
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <p className="text-base font-normal">Revisa y aprueba los reportes de ventas de tus zonas</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">En Revisión</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">{totalEnRevision}</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">hourglass_empty</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#617589] dark:text-slate-400">Total a Revisar</p>
              <p className="text-3xl font-black text-[#111418] dark:text-white mt-2">{totalReportes}</p>
            </div>
            <div className="rounded-lg bg-[#1173d4]/10 dark:bg-[#1173d4]/20 p-3 text-[#1173d4]">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Reportes */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white">Reportes Pendientes de Revisión</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
          </div>
        ) : reportes.length === 0 ? (
          <div className="p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">task_alt</span>
            <p className="text-lg font-semibold mb-2">No hay reportes pendientes</p>
            <p className="text-sm">Todos los reportes han sido revisados</p>
          </div>
        ) : (
          <>
            <TablaReportes
              reportes={reportes}
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
                    <span>Revisar</span>
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

export default VistaRevision


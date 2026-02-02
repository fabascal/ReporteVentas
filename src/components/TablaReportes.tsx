import { ReporteVentas, EstadoReporte } from '../types/reportes'
import { ReactNode } from 'react'

interface TablaReportesProps {
  reportes: ReporteVentas[]
  calcularTotalVentas: (reporte: ReporteVentas) => number
  getEstadoBadge?: (estado: EstadoReporte) => string
  getEstadoIcon?: (estado: EstadoReporte) => string
  handleVerDetalle: (reporte: ReporteVentas) => void
  handleCambiarEstado?: (reporte: ReporteVentas) => void
  showAcciones?: boolean
  showEstado?: boolean
  showEditar?: boolean
  renderAcciones?: (reporte: ReporteVentas) => ReactNode
}

export default function TablaReportes({
  reportes,
  calcularTotalVentas,
  getEstadoBadge,
  getEstadoIcon,
  handleVerDetalle,
  handleCambiarEstado,
  showAcciones = true,
  showEstado = true,
  showEditar = true,
  renderAcciones,
}: TablaReportesProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
        <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold">
          <tr>
            <th className="px-6 py-4" scope="col">
              Fecha
            </th>
            <th className="px-6 py-4" scope="col">
              Estación
            </th>
            <th className="px-6 py-4" scope="col">
              Premium
            </th>
            <th className="px-6 py-4" scope="col">
              Magna
            </th>
            <th className="px-6 py-4" scope="col">
              Diesel
            </th>
            <th className="px-6 py-4 text-right" scope="col">
              Total Ventas
            </th>
            {showEstado && (
              <th className="px-6 py-4" scope="col">
                Estado
              </th>
            )}
            <th className="px-6 py-4" scope="col">
              Creado Por / Fecha Creación
            </th>
            {showAcciones && (
              <th className="px-6 py-4 text-center" scope="col">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
          {reportes.map((reporte) => {
            const totalVentas = calcularTotalVentas(reporte)
            return (
              <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                <td className="px-6 py-4 font-medium text-[#111418] dark:text-white">
                  {new Date(reporte.fecha).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#111418] dark:text-white">{reporte.estacionNombre}</div>
                </td>
                <td className="px-6 py-4">
                  {(reporte.premium.mermaVolumen > 0 || reporte.premium.mermaImporte > 0) ? (
                    <div className="text-xs">
                      <div className="text-[#617589] dark:text-slate-400">
                        {reporte.premium.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </div>
                      <div className="text-[#617589] dark:text-slate-400 font-semibold">
                        {reporte.premium.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#617589] dark:text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {(reporte.magna.mermaVolumen > 0 || reporte.magna.mermaImporte > 0) ? (
                    <div className="text-xs">
                      <div className="text-[#617589] dark:text-slate-400">
                        {reporte.magna.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </div>
                      <div className="text-[#617589] dark:text-slate-400 font-semibold">
                        {reporte.magna.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#617589] dark:text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {(reporte.diesel.mermaVolumen > 0 || reporte.diesel.mermaImporte > 0) ? (
                    <div className="text-xs">
                      <div className="text-[#617589] dark:text-slate-400">
                        {reporte.diesel.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                      </div>
                      <div className="text-[#617589] dark:text-slate-400 font-semibold">
                        {reporte.diesel.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-[#617589] dark:text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-bold text-[#111418] dark:text-white">
                  ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {showEstado && getEstadoBadge && getEstadoIcon && (
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${getEstadoBadge(reporte.estado)}`}
                    >
                      <span className="material-symbols-outlined text-sm">{getEstadoIcon(reporte.estado)}</span>
                      {reporte.estado}
                    </span>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="text-sm text-[#111418] dark:text-white">{reporte.creadoPor}</div>
                  {reporte.fechaCreacion && (
                    <div className="text-xs text-[#617589] dark:text-slate-400">
                      {new Date(reporte.fechaCreacion).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </td>
                {showAcciones && (
                  <td className="px-6 py-4">
                    {renderAcciones ? (
                      renderAcciones(reporte)
                    ) : (
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleVerDetalle(reporte)}
                          className="size-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                          title="Ver Detalle"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        {showEditar && handleCambiarEstado && (reporte.estado === EstadoReporte.Pendiente || reporte.estado === EstadoReporte.EnRevision) && (
                          <button
                            onClick={() => handleCambiarEstado(reporte)}
                            className="size-9 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                            title="Cambiar Estado"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


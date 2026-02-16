import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas } from '../types/reportes'
import DirectorHeader from '../components/DirectorHeader'
import { formatFechaSolo } from '../utils/dateUtils'

export default function DashboardDirector() {
  const { user, logout } = useAuth()

  const { data: reportes = [], isLoading } = useQuery({
    queryKey: ['reportes', 'director'],
    queryFn: () => reportesService.getReportes(1, 1000, 'Aprobado'),
    select: (data) => data.data,
  })

  // Calcular totales
  const calcularTotal = (reportes: ReporteVentas[]) => {
    return reportes.reduce(
      (acc, r) => {
        acc.premium += r.premium.importe
        acc.magna += r.magna.importe
        acc.diesel += r.diesel.importe
        acc.aceites += r.aceites || 0
        return acc
      },
      { premium: 0, magna: 0, diesel: 0, aceites: 0 }
    )
  }

  const totales = calcularTotal(reportes)
  const totalGeneral = totales.premium + totales.magna + totales.diesel + totales.aceites

  const calcularTotalVentas = (reporte: ReporteVentas) => {
    return reporte.premium.importe + reporte.magna.importe + reporte.diesel.importe + (reporte.aceites || 0)
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DirectorHeader />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Page Heading */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Dashboard Nacional de Ventas
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <p className="text-base font-normal">Resumen ejecutivo de reportes capturados</p>
            </div>
          </div>
        </div>

        {/* KPI Cards - Totales por Combustible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Premium */}
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-3xl">local_gas_station</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Premium</p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">
              ${totales.premium.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          {/* Magna */}
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined text-3xl">local_gas_station</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Magna</p>
            <p className="text-3xl font-black text-green-600 dark:text-green-400 tracking-tight">
              ${totales.magna.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          {/* Diesel */}
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-gray-500/20 group-hover:bg-gray-500 transition-colors"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/30 p-3 text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-3xl">local_gas_station</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Diesel</p>
            <p className="text-3xl font-black text-gray-700 dark:text-gray-300 tracking-tight">
              ${totales.diesel.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>

          {/* Total General */}
          <div className="rounded-xl border-2 border-[#1173d4] dark:border-[#1173d4] bg-[#1173d4]/5 dark:bg-[#1173d4]/10 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="rounded-lg bg-[#1173d4]/20 dark:bg-[#1173d4]/30 p-3 text-[#1173d4]">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
            </div>
            <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Total General</p>
            <p className="text-3xl font-black text-[#1173d4] tracking-tight">
              ${totalGeneral.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </p>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white">Reportes Aprobados</h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
            </div>
          ) : reportes.length === 0 ? (
            <div className="p-12 text-center text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4">description</span>
              <p className="text-lg font-semibold mb-2">No hay reportes aprobados disponibles</p>
              <p className="text-sm">Los reportes aprobados aparecerán aquí</p>
            </div>
          ) : (
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
                    <th className="px-6 py-4" scope="col">
                      Revisado Por
                    </th>
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
                          {reporte.creadoPor && (
                            <div className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                              Por: {reporte.creadoPor}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-[#617589] dark:text-slate-400">
                            {reporte.premium.litros.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                          </div>
                          {reporte.premium.merma > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                              Merma: {reporte.premium.merma.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                            </div>
                          )}
                          <div className="font-medium text-red-600 dark:text-red-400 text-sm">
                            ${reporte.premium.precio.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} /L
                          </div>
                          <div className="font-semibold text-red-700 dark:text-red-500 mt-1">
                            ${reporte.premium.importe.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </div>
                          {(reporte.premium.mermaVolumen > 0 || reporte.premium.mermaImporte > 0) && (
                            <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma Vol: {reporte.premium.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma $: ${reporte.premium.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                              </div>
                              {reporte.premium.mermaPorcentaje > 0 && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                  {reporte.premium.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%
                                </div>
                              )}
                            </div>
                          )}
                          {(reporte.premium.iib || reporte.premium.compras || reporte.premium.cct || reporte.premium.vDsc || reporte.premium.dc || reporte.premium.difVDsc || reporte.premium.if || reporte.premium.iffb) && (
                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Inv. y Compras:</div>
                              {reporte.premium.iib > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.I.B.: {reporte.premium.iib.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.compras > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">C: {reporte.premium.compras.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.cct > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">CCT: {reporte.premium.cct.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.vDsc > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">V.Dsc: {reporte.premium.vDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.dc !== undefined && reporte.premium.dc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">DC: {reporte.premium.dc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.difVDsc !== undefined && reporte.premium.difVDsc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">Dif V.Dsc: {reporte.premium.difVDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.if !== undefined && reporte.premium.if !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.: {reporte.premium.if.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.premium.iffb > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.F.B.: {reporte.premium.iffb.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-[#617589] dark:text-slate-400">
                            {reporte.magna.litros.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                          </div>
                          <div className="font-medium text-green-600 dark:text-green-400 text-sm">
                            ${reporte.magna.precio.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} /L
                          </div>
                          <div className="font-semibold text-green-700 dark:text-green-500 mt-1">
                            ${reporte.magna.importe.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </div>
                          {(reporte.magna.mermaVolumen > 0 || reporte.magna.mermaImporte > 0) && (
                            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma Vol: {reporte.magna.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma $: ${reporte.magna.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                              </div>
                              {reporte.magna.mermaPorcentaje > 0 && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                  {reporte.magna.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%
                                </div>
                              )}
                            </div>
                          )}
                          {(reporte.magna.iib || reporte.magna.compras || reporte.magna.cct || reporte.magna.vDsc || reporte.magna.dc || reporte.magna.difVDsc || reporte.magna.if || reporte.magna.iffb) && (
                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Inv. y Compras:</div>
                              {reporte.magna.iib > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.I.B.: {reporte.magna.iib.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.compras > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">C: {reporte.magna.compras.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.cct > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">CCT: {reporte.magna.cct.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.vDsc > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">V.Dsc: {reporte.magna.vDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.dc !== undefined && reporte.magna.dc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">DC: {reporte.magna.dc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.difVDsc !== undefined && reporte.magna.difVDsc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">Dif V.Dsc: {reporte.magna.difVDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.if !== undefined && reporte.magna.if !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.: {reporte.magna.if.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.magna.iffb > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.F.B.: {reporte.magna.iffb.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-[#617589] dark:text-slate-400">
                            {reporte.diesel.litros.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                          </div>
                          <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                            ${reporte.diesel.precio.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} /L
                          </div>
                          <div className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                            ${reporte.diesel.importe.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          </div>
                          {(reporte.diesel.mermaVolumen > 0 || reporte.diesel.mermaImporte > 0) && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma Vol: {reporte.diesel.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L
                              </div>
                              <div className="text-xs text-orange-600 dark:text-orange-400">
                                Merma $: ${reporte.diesel.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                              </div>
                              {reporte.diesel.mermaPorcentaje > 0 && (
                                <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                  {reporte.diesel.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%
                                </div>
                              )}
                            </div>
                          )}
                          {(reporte.diesel.iib || reporte.diesel.compras || reporte.diesel.cct || reporte.diesel.vDsc || reporte.diesel.dc || reporte.diesel.difVDsc || reporte.diesel.if || reporte.diesel.iffb) && (
                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Inv. y Compras:</div>
                              {reporte.diesel.iib > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.I.B.: {reporte.diesel.iib.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.compras > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">C: {reporte.diesel.compras.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.cct > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">CCT: {reporte.diesel.cct.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.vDsc > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">V.Dsc: {reporte.diesel.vDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.dc !== undefined && reporte.diesel.dc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">DC: {reporte.diesel.dc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.difVDsc !== undefined && reporte.diesel.difVDsc !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">Dif V.Dsc: {reporte.diesel.difVDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.if !== undefined && reporte.diesel.if !== 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.: {reporte.diesel.if.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                              {reporte.diesel.iffb > 0 && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">I.F.F.B.: {reporte.diesel.iffb.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#111418] dark:text-white">
                          ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-[#111418] dark:text-white">{reporte.revisadoPor || 'N/A'}</div>
                          {reporte.fechaRevision && (
                            <div className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                              {formatFechaSolo(reporte.fechaRevision)}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

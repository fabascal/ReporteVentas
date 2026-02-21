import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import DynamicHeader from '../components/DynamicHeader'
import { reportesService } from '../services/reportesService'
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos'

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

function formatMoney(value: number | undefined): string {
  return (value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(value?: string): string {
  if (!value) return '-'
  return new Date(value).toLocaleString('es-MX')
}

export default function DirectorLiquidaciones() {
  const navigate = useNavigate()
  const { aniosDisponibles, anioMasReciente } = useEjerciciosActivos()
  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'))
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))

  const { data, isLoading } = useQuery({
    queryKey: ['director-liquidaciones', mes, anio],
    queryFn: () => reportesService.getReporteLiquidaciones(mes, anio),
  })

  const periodoNombre = useMemo(() => {
    return `${MONTHS[Math.max(0, Number(mes) - 1)] || mes} ${anio}`
  }, [mes, anio])

  const resumen = data?.resumen
  const folio = useMemo(() => `LQ-${anio}${mes}`, [anio, mes])

  useEffect(() => {
    document.body.classList.add('print-liquidaciones')
    return () => document.body.classList.remove('print-liquidaciones')
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />

      <main className="liquidaciones-print-area flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="liquidaciones-no-print flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/director/reportes')}
                className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#253240] transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Volver a Reportes
              </button>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                Liquidaciones
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                <p className="text-base font-normal">Resumen financiero de cierre por zona y estación ({periodoNombre})</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1a2632] p-4 rounded-xl shadow-sm border border-[#e6e8eb] dark:border-slate-700">
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
              >
                {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                  <option key={m} value={m}>
                    {MONTHS[Number(m) - 1]}
                  </option>
                ))}
              </select>
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
              >
                {(aniosDisponibles.length > 0 ? aniosDisponibles : [Number(anioMasReciente || anio)]).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1173d4] hover:bg-[#0f67be] text-white text-sm font-semibold transition-colors"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Imprimir / PDF
              </button>
            </div>
          </div>

          <div className="hidden liquidaciones-print-header">
            <h1 className="text-2xl font-bold">Reporte Ejecutivo de Liquidaciones</h1>
            <div className="liquidaciones-print-meta">
              <p><strong>Folio:</strong> {folio}</p>
              <p><strong>Periodo:</strong> {periodoNombre}</p>
              <p><strong>Fecha de generación:</strong> {new Date().toLocaleString('es-MX')}</p>
            </div>
            <div className="liquidaciones-print-summary">
              <div><strong>Saldo Final Consolidado:</strong> ${formatMoney(resumen?.total_saldo_final || 0)}</div>
              <div><strong>Diferencia Consolidada:</strong> ${formatMoney(resumen?.total_diferencia || 0)}</div>
              <div><strong>Entregas Registradas:</strong> ${formatMoney(resumen?.total_entregas || 0)}</div>
              <div><strong>Gastos Registrados:</strong> ${formatMoney(resumen?.total_gastos || 0)}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4]"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard label="Saldo Final Consolidado" value={resumen?.total_saldo_final || 0} tone="blue" />
                <KpiCard label="Diferencia Consolidada" value={resumen?.total_diferencia || 0} tone="indigo" />
                <KpiCard label="Entregas Registradas" value={resumen?.total_entregas || 0} tone="green" />
                <KpiCard label="Gastos Registrados" value={resumen?.total_gastos || 0} tone="amber" />
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-[#617589] dark:text-slate-400">Zona / Estación</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Merma</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Entregas</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Gastos</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Saldo Inicial</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Saldo Final</th>
                      <th className="px-4 py-3 text-right font-bold text-[#617589] dark:text-slate-400">Diferencia</th>
                      <th className="px-4 py-3 text-left font-bold text-[#617589] dark:text-slate-400">Fecha Cierre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                    {(data?.zonas || []).map((zona) => (
                      <Fragment key={zona.zona_id}>
                        <tr key={zona.zona_id} className="bg-[#f8fbff] dark:bg-[#15202d]">
                          <td className="px-4 py-3 font-bold text-[#111418] dark:text-white">{zona.zona_nombre}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(zona.merma_generada)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(zona.entregas_realizadas)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(zona.gastos_realizados)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(zona.saldo_inicial)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMoney(zona.saldo_final)}</td>
                          <td className={`px-4 py-3 text-right font-semibold ${zona.diferencia < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>
                            {formatMoney(zona.diferencia)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#617589] dark:text-slate-400">{formatDate(zona.fecha_cierre)}</td>
                        </tr>
                        {zona.estaciones.map((est) => (
                          <tr key={est.estacion_id}>
                            <td className="px-4 py-2 pl-8 text-[#111418] dark:text-white">
                              {est.estacion_nombre}
                            </td>
                            <td className="px-4 py-2 text-right">{formatMoney(est.merma_generada)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(est.entregas_realizadas)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(est.gastos_realizados)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(est.saldo_inicial)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(est.saldo_final)}</td>
                            <td className={`px-4 py-2 text-right ${est.diferencia < 0 ? 'text-red-600 font-semibold' : ''}`}>
                              {formatMoney(est.diferencia)}
                            </td>
                            <td className="px-4 py-2 text-xs text-[#617589] dark:text-slate-400">{formatDate(est.fecha_cierre)}</td>
                          </tr>
                        ))}
                        {zona.observaciones && (
                          <tr>
                            <td colSpan={8} className="px-4 py-2 text-xs italic text-[#617589] dark:text-slate-400 bg-gray-50 dark:bg-[#111827]">
                              Observaciones de cierre ({zona.zona_nombre}): {zona.observaciones}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {(data?.zonas || []).length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-[#617589] dark:text-slate-400">
                          No hay liquidaciones cerradas para el periodo seleccionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="hidden liquidaciones-print-footer">
                <p>Documento de uso directivo. Valores expresados en MXN.</p>
                <p>ReporteVentas - {new Date().toLocaleDateString('es-MX')}</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'indigo' | 'green' | 'amber' }) {
  const toneClass =
    tone === 'blue'
      ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
      : tone === 'indigo'
      ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20'
      : tone === 'green'
      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
      : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'

  return (
    <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-[#617589] dark:text-slate-400">{label}</div>
      <div className={`mt-3 text-2xl font-black px-3 py-2 rounded-lg ${toneClass}`}>${formatMoney(value)}</div>
    </div>
  )
}

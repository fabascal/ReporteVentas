import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../services/reportesService'
import { ReporteVentas } from '../types/reportes'
import DirectorHeader from '../components/DirectorHeader'
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos'

export default function DashboardDirector() {
  const { aniosDisponibles, anioMasReciente } = useEjerciciosActivos()
  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'))
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [unidadVista, setUnidadVista] = useState<'MXN' | 'LTS'>('MXN')

  const fechaDesde = `${anio}-${mes}-01`
  const fechaHasta = new Date(Number(anio), Number(mes), 0).toISOString().slice(0, 10)

  const { data: reportes = [], isLoading } = useQuery({
    queryKey: ['reportes', 'director', mes, anio],
    queryFn: () => reportesService.getReportes(1, 5000, 'Aprobado', undefined, undefined, fechaDesde, fechaHasta),
    select: (data) => data.data,
  })

  const metrics = useMemo(() => buildExecutiveMetrics(reportes), [reportes])

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  const periodoTexto = `${meses[Math.max(0, Number(mes) - 1)] || mes} ${anio}`

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DirectorHeader />

      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
              Dashboard Ejecutivo Nacional
            </h1>
            <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              <p className="text-base font-normal">Compras vs ventas y riesgo de merma por periodo ({periodoTexto})</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-[#1a2632] p-4 rounded-xl border border-[#e6e8eb] dark:border-slate-700">
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                <option key={m} value={m}>{meses[Number(m) - 1]}</option>
              ))}
            </select>
            <select
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm"
            >
              {(aniosDisponibles.length > 0 ? aniosDisponibles : [Number(anioMasReciente || anio)]).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="inline-flex rounded-lg border border-[#dbe0e6] dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setUnidadVista('MXN')}
                className={`px-3 py-2 text-xs font-semibold ${unidadVista === 'MXN' ? 'bg-[#1173d4] text-white' : 'bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white'}`}
              >
                MXN
              </button>
              <button
                onClick={() => setUnidadVista('LTS')}
                className={`px-3 py-2 text-xs font-semibold ${unidadVista === 'LTS' ? 'bg-[#1173d4] text-white' : 'bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white'}`}
              >
                LTS
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4] mx-auto"></div>
          </div>
        ) : reportes.length === 0 ? (
          <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-12 text-center text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
            <p className="text-lg font-semibold mb-2">Sin datos para el periodo seleccionado</p>
            <p className="text-sm">Selecciona otro mes/año para consultar indicadores.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Kpi
                title={unidadVista === 'MXN' ? 'Ventas Totales (MXN)' : 'Ventas Totales (LTS)'}
                value={unidadVista === 'MXN' ? `$${money(metrics.totalVentas)}` : `${num(metrics.totalVentasLitros)} L`}
                tone="blue"
              />
              <Kpi
                title={unidadVista === 'MXN' ? 'Compras Totales (MXN)' : 'Compras Totales (L)'}
                value={unidadVista === 'MXN' ? `$${money(metrics.totalComprasPesos)}` : `${num(metrics.totalComprasLitros)} L`}
                tone="indigo"
              />
              <Kpi
                title="Merma Promedio (%)"
                value={
                  unidadVista === 'MXN'
                    ? `Pnd: ${num(metrics.mermaFinPonderadoPct)}%`
                    : `Pnd: ${num(metrics.mermaVolPonderadoPct)}%`
                }
                secondaryValue={
                  unidadVista === 'MXN'
                    ? `Prm: ${num(metrics.mermaFinSimplePct)}%`
                    : `Prm: ${num(metrics.mermaVolSimplePct)}%`
                }
                tone="amber"
              />
              <Kpi
                title={unidadVista === 'MXN' ? 'Merma en Pesos' : 'Merma en Litros'}
                value={
                  unidadVista === 'MXN'
                    ? `$${money(metrics.totalMermaPesos)}`
                    : `${num(metrics.totalMermaVol)} L`
                }
                tone="green"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <ChartCard
                title={unidadVista === 'MXN' ? 'Compras vs Ventas (MXN)' : 'Compras vs Ventas (LTS)'}
                subtitle="Comparativo nacional del periodo"
                rows={[
                  {
                    label: 'Compras',
                    value: unidadVista === 'MXN' ? metrics.totalComprasPesos : metrics.totalComprasLitros,
                  },
                  {
                    label: 'Ventas',
                    value: unidadVista === 'MXN' ? metrics.totalVentas : metrics.totalVentasLitros,
                  },
                ]}
              />
              <ChartCard
                title="Merma % Promedio por Zona"
                subtitle="Comparativo ponderado vs promedio simple"
                valueSuffix="%"
                rows={metrics.mermaPorZona.map((x) => ({
                  label: x.label,
                  value: x.ponderado,
                  secondaryValue: x.simple,
                }))}
                secondaryValueSuffix="%"
              />
              <ChartCard
                title={unidadVista === 'MXN' ? 'Merma por Producto (MXN)' : 'Merma por Producto (LTS)'}
                subtitle="Potencial de ganancia por combustible"
                rows={unidadVista === 'MXN'
                  ? [
                      { label: 'Premium', value: metrics.mermaPesosPorProducto.premium },
                      { label: 'Magna', value: metrics.mermaPesosPorProducto.magna },
                      { label: 'Diesel', value: metrics.mermaPesosPorProducto.diesel },
                    ]
                  : [
                      { label: 'Premium', value: metrics.mermaVolPorProducto.premium },
                      { label: 'Magna', value: metrics.mermaVolPorProducto.magna },
                      { label: 'Diesel', value: metrics.mermaVolPorProducto.diesel },
                    ]}
              />
            </div>

            <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e6e8eb] dark:border-slate-700">
                <h3 className="text-lg font-bold text-[#111418] dark:text-white">Top Estaciones por Relación de Merma</h3>
                <p className="text-sm text-[#617589] dark:text-slate-400 mt-1">
                  Ranking por % merma financiera y referencia de % merma volumétrica
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold">
                    <tr>
                      <th className="px-6 py-3 text-left">Estación</th>
                      <th className="px-6 py-3 text-left">Zona</th>
                      <th className="px-6 py-3 text-right">Merma $</th>
                      <th className="px-6 py-3 text-right">Ventas</th>
                      <th className="px-6 py-3 text-right">% Merma Financiera</th>
                      <th className="px-6 py-3 text-right">Merma L</th>
                      <th className="px-6 py-3 text-right">Ventas L</th>
                      <th className="px-6 py-3 text-right">% Merma Volumétrica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                    {metrics.topEstaciones.map((row) => (
                      <tr key={row.estacionId} className="hover:bg-gray-50 dark:hover:bg-[#1a2632]">
                        <td className="px-6 py-3 font-semibold text-[#111418] dark:text-white">{row.estacion}</td>
                        <td className="px-6 py-3 text-[#617589] dark:text-slate-400">{row.zona}</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">${money(row.mermaPesos)}</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">${money(row.ventas)}</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">{num(row.mermaPctFin)}%</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">{num(row.mermaVol)} L</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">{num(row.ventasLitros)} L</td>
                        <td className="px-6 py-3 text-right text-[#111418] dark:text-white">{num(row.mermaPctVol)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function money(value: number) {
  return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function num(value: number) {
  return value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Kpi({
  title,
  value,
  secondaryValue,
  tone,
}: {
  title: string
  value: string
  secondaryValue?: string
  tone: 'blue' | 'indigo' | 'green' | 'amber'
}) {
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
      <div className="text-xs uppercase tracking-wide text-[#617589] dark:text-slate-400">{title}</div>
      <div className={`mt-3 px-3 py-2 rounded-lg ${toneClass}`}>
        {secondaryValue ? (
          <div className="flex items-center gap-4 text-lg font-black">
            <span>{value}</span>
            <span>{secondaryValue}</span>
          </div>
        ) : (
          <div className="text-2xl font-black">{value}</div>
        )}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  valueSuffix,
  secondaryValueSuffix,
  rows,
}: {
  title: string
  subtitle: string
  valueSuffix?: string
  secondaryValueSuffix?: string
  rows: Array<{ label: string; value: number; secondaryValue?: number }>
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-5 shadow-sm">
      <h3 className="text-base font-bold text-[#111418] dark:text-white">{title}</h3>
      <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">{subtitle}</p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#111418] dark:text-white">{row.label}</span>
              <div className="text-right">
                <div className="font-semibold text-[#111418] dark:text-white">
                  Pnd: {num(row.value)}{valueSuffix || ''}
                </div>
                {row.secondaryValue !== undefined && (
                  <div className="font-semibold text-[#111418] dark:text-white">
                    Prm: {num(row.secondaryValue)}{secondaryValueSuffix || ''}
                  </div>
                )}
              </div>
            </div>
            <div className="h-2 w-full rounded bg-gray-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-[#1173d4]"
                style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function buildExecutiveMetrics(reportes: ReporteVentas[]) {
  let totalVentas = 0
  let totalVentasLitros = 0
  let totalComprasLitros = 0
  let totalComprasPesos = 0
  let totalMermaVol = 0
  let totalMermaPesos = 0

  const mermaPesosPorProducto = { premium: 0, magna: 0, diesel: 0 }
  const mermaVolPorProducto = { premium: 0, magna: 0, diesel: 0 }
  const zoneMap = new Map<string, { mermaVol: number; litros: number; sumaPctEstaciones: number; estaciones: number }>()

  const stationMap = new Map<
    string,
    { estacionId: string; estacion: string; zona: string; ventas: number; mermaPesos: number; mermaVol: number; litros: number }
  >()

  for (const r of reportes) {
    const ventasReporte = r.premium.importe + r.magna.importe + r.diesel.importe + (r.aceites || 0)
    totalVentas += ventasReporte

    const litrosReporte = (r.premium.litros || 0) + (r.magna.litros || 0) + (r.diesel.litros || 0)
    const comprasReporte = (r.premium.compras || 0) + (r.magna.compras || 0) + (r.diesel.compras || 0)
    const comprasPesosReporte =
      (r.premium.compras || 0) * (r.premium.precio || 0) +
      (r.magna.compras || 0) * (r.magna.precio || 0) +
      (r.diesel.compras || 0) * (r.diesel.precio || 0)
    const mermaVolReporte = (r.premium.mermaVolumen || 0) + (r.magna.mermaVolumen || 0) + (r.diesel.mermaVolumen || 0)
    const mermaPesosReporte = (r.premium.mermaImporte || 0) + (r.magna.mermaImporte || 0) + (r.diesel.mermaImporte || 0)

    totalVentasLitros += litrosReporte
    totalComprasLitros += comprasReporte
    totalComprasPesos += comprasPesosReporte
    totalMermaVol += mermaVolReporte
    totalMermaPesos += mermaPesosReporte

    mermaPesosPorProducto.premium += r.premium.mermaImporte || 0
    mermaPesosPorProducto.magna += r.magna.mermaImporte || 0
    mermaPesosPorProducto.diesel += r.diesel.mermaImporte || 0
    mermaVolPorProducto.premium += r.premium.mermaVolumen || 0
    mermaVolPorProducto.magna += r.magna.mermaVolumen || 0
    mermaVolPorProducto.diesel += r.diesel.mermaVolumen || 0

    const zona = r.zonaNombre || 'Sin zona'
    const zoneAgg = zoneMap.get(zona) || { mermaVol: 0, litros: 0, sumaPctEstaciones: 0, estaciones: 0 }
    zoneAgg.mermaVol += mermaVolReporte
    zoneAgg.litros += litrosReporte
    const pctEstacion = litrosReporte > 0 ? (mermaVolReporte / litrosReporte) * 100 : 0
    zoneAgg.sumaPctEstaciones = (zoneAgg.sumaPctEstaciones || 0) + pctEstacion
    zoneAgg.estaciones = (zoneAgg.estaciones || 0) + 1
    zoneMap.set(zona, zoneAgg)

    const stationAgg =
      stationMap.get(r.estacionId) || {
        estacionId: r.estacionId,
        estacion: r.estacionNombre,
        zona,
        ventas: 0,
        mermaPesos: 0,
        mermaVol: 0,
        litros: 0,
      }
    stationAgg.ventas += ventasReporte
    stationAgg.mermaPesos += mermaPesosReporte
    stationAgg.mermaVol += mermaVolReporte
    stationAgg.litros += litrosReporte
    stationMap.set(r.estacionId, stationAgg)
  }

  const mermaPorZona = Array.from(zoneMap.entries())
    .map(([label, val]) => ({
      label,
      ponderado: val.litros > 0 ? (val.mermaVol / val.litros) * 100 : 0,
      simple: val.estaciones > 0 ? val.sumaPctEstaciones / val.estaciones : 0,
    }))
    .sort((a, b) => b.ponderado - a.ponderado)

  const topEstaciones = Array.from(stationMap.values())
    .map((s) => ({
      estacionId: s.estacionId,
      estacion: s.estacion,
      zona: s.zona,
      ventas: s.ventas,
      ventasLitros: s.litros,
      mermaPesos: s.mermaPesos,
      mermaVol: s.mermaVol,
      mermaPctVol: s.litros > 0 ? (s.mermaVol / s.litros) * 100 : 0,
      mermaPctFin: s.ventas > 0 ? (s.mermaPesos / s.ventas) * 100 : 0,
    }))
    .sort((a, b) => b.mermaPctFin - a.mermaPctFin)
    .slice(0, 12)

  const estacionesParaPromedio = Array.from(stationMap.values())
  const mermaVolSimplePct =
    estacionesParaPromedio.length > 0
      ? estacionesParaPromedio.reduce(
          (sum, s) => sum + (s.litros > 0 ? (s.mermaVol / s.litros) * 100 : 0),
          0
        ) / estacionesParaPromedio.length
      : 0

  const mermaFinSimplePct =
    estacionesParaPromedio.length > 0
      ? estacionesParaPromedio.reduce(
          (sum, s) => sum + (s.ventas > 0 ? (s.mermaPesos / s.ventas) * 100 : 0),
          0
        ) / estacionesParaPromedio.length
      : 0

  return {
    totalReportes: reportes.length,
    totalVentas,
    totalVentasLitros,
    totalComprasLitros,
    totalComprasPesos,
    mermaVolPonderadoPct: totalVentasLitros > 0 ? (totalMermaVol / totalVentasLitros) * 100 : 0,
    mermaVolSimplePct,
    mermaFinPonderadoPct: totalVentas > 0 ? (totalMermaPesos / totalVentas) * 100 : 0,
    mermaFinSimplePct,
    totalMermaPesos,
    totalMermaVol,
    mermaPesosPorProducto,
    mermaVolPorProducto,
    mermaPorZona,
    topEstaciones,
  }
}

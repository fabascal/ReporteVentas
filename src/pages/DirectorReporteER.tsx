import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import DynamicHeader from '../components/DynamicHeader'
import { reportesService } from '../services/reportesService'
import { zonasEstacionesService } from '../services/zonasEstacionesService'
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

function formatPercent(value: number | undefined): string {
  const n = value ?? 0
  return `${n.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

export default function DirectorReporteER() {
  const navigate = useNavigate()
  const { aniosDisponibles, anioMasReciente } = useEjerciciosActivos()

  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'))
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [zonaId, setZonaId] = useState('')

  const { data: zonas = [], isLoading: isLoadingZonas } = useQuery({
    queryKey: ['zonas-activas-reporte-er'],
    queryFn: zonasEstacionesService.getZonas,
    select: (data) => data.filter((zona) => zona.activa),
  })

  const zonasOrdenadas = useMemo(() => {
    return [...zonas].sort((a, b) => {
      const orderA = a.orden_reporte ?? 99
      const orderB = b.orden_reporte ?? 99
      if (orderA !== orderB) return orderA - orderB
      return a.nombre.localeCompare(b.nombre, 'es-MX')
    })
  }, [zonas])

  useEffect(() => {
    if (!zonaId && zonasOrdenadas.length > 0) {
      setZonaId(zonasOrdenadas[0].id)
    }
  }, [zonasOrdenadas, zonaId])

  useEffect(() => {
    if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(Number(anio))) {
      setAnio(String(anioMasReciente))
    }
  }, [aniosDisponibles, anio, anioMasReciente])

  const { data, isLoading: isLoadingData } = useQuery({
    queryKey: ['director-reporte-er', mes, anio, zonaId],
    queryFn: () => reportesService.getReporteERPorZona(mes, anio, zonaId),
    enabled: Boolean(zonaId && mes && anio),
  })

  const tituloPeriodo = useMemo(() => {
    const monthName = MONTHS[Math.max(0, Number(mes) - 1)] || mes
    return `${monthName} ${anio}`
  }, [mes, anio])

  const promediosPorProducto = useMemo(() => {
    const acumulados: Record<string, { suma: number; count: number }> = {}

    ;(data?.productos || []).forEach((producto) => {
      acumulados[producto.id] = { suma: 0, count: 0 }
    })

    ;(data?.filas || []).forEach((fila) => {
      ;(data?.productos || []).forEach((producto) => {
        const value = fila.valores[producto.id]
        if (typeof value === 'number' && Number.isFinite(value)) {
          acumulados[producto.id].suma += value
          acumulados[producto.id].count += 1
        }
      })
    })

    const promedios: Record<string, number> = {}
    Object.entries(acumulados).forEach(([productoId, stats]) => {
      promedios[productoId] = stats.count > 0 ? stats.suma / stats.count : 0
    })

    return promedios
  }, [data])

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />

      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[95%] mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/director/reportes')}
                className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#253240] transition-colors"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Volver a Reportes
              </button>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                Reporte ER
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">table_chart</span>
                <p className="text-base font-normal">
                  E% por estación y producto ({tituloPeriodo})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#1a2632] p-4 rounded-xl shadow-sm border border-[#e6e8eb] dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">
                  Zona
                </label>
                <select
                  value={zonaId}
                  onChange={(e) => setZonaId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  {zonasOrdenadas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">
                  Mes
                </label>
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
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">
                  Año
                </label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  {(aniosDisponibles.length > 0 ? aniosDisponibles : [Number(anio)]).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoadingZonas || isLoadingData ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4]"></div>
            </div>
          ) : !zonaId ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-[#1a2632] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Selecciona una zona para ver el reporte.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
              <div className="px-6 py-4 border-b border-[#e6e8eb] dark:border-slate-700">
                <h2 className="text-lg font-bold text-[#111418] dark:text-white">
                  Zona: {data?.zona.nombre || '-'}
                </h2>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                      Estación
                    </th>
                    {(data?.productos || []).map((producto) => (
                      <th
                        key={producto.id}
                        className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400"
                      >
                        <div className="flex flex-col items-end">
                          <span>{producto.nombre_display}</span>
                          <span className="text-sm normal-case font-semibold text-[#1173d4] dark:text-blue-400 mt-0.5">
                            Promedio: {formatPercent(promediosPorProducto[producto.id] ?? 0)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {(data?.filas || []).map((fila) => (
                    <tr key={fila.estacion_id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                      <td className="px-4 py-3 text-base font-semibold text-[#111418] dark:text-white">
                        {fila.estacion_nombre}
                      </td>
                      {(data?.productos || []).map((producto) => {
                        const value = fila.valores[producto.id] ?? 0
                        return (
                          <td
                            key={`${fila.estacion_id}-${producto.id}`}
                            className={`px-4 py-3 text-right text-base font-semibold ${value < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}
                          >
                            {formatPercent(value)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {(data?.filas || []).length === 0 && (
                    <tr>
                      <td
                        colSpan={Math.max(1, (data?.productos?.length || 0) + 1)}
                        className="px-4 py-10 text-center text-[#617589] dark:text-slate-400"
                      >
                        No hay datos para el periodo seleccionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

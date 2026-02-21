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

function formatNumber(value: number | undefined, decimals: number = 2): string {
  return (value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function DirectorReporteConciliacion() {
  const navigate = useNavigate()
  const { aniosDisponibles, anioMasReciente } = useEjerciciosActivos()

  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'))
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [zonaId, setZonaId] = useState('')

  const { data: zonas = [], isLoading: isLoadingZonas } = useQuery({
    queryKey: ['zonas-activas-reporte-conciliacion'],
    queryFn: zonasEstacionesService.getZonas,
    select: (data) => data.filter((zona) => zona.activa),
  })

  useEffect(() => {
    if (aniosDisponibles.length > 0 && !aniosDisponibles.includes(Number(anio))) {
      setAnio(String(anioMasReciente))
    }
  }, [aniosDisponibles, anio, anioMasReciente])

  const { data, isLoading } = useQuery({
    queryKey: ['director-reporte-conciliacion', mes, anio],
    queryFn: () => reportesService.getReporteConciliacionMensual(mes, anio),
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
    if (zonasOrdenadas.length === 0) {
      setZonaId('')
      return
    }

    const existeZonaSeleccionada = zonasOrdenadas.some((z) => z.id === zonaId)
    if (!existeZonaSeleccionada) {
      setZonaId(zonasOrdenadas[0].id)
    }
  }, [zonasOrdenadas, zonaId])

  const zonaSeleccionada = useMemo(() => {
    return (data?.zonas || []).find((z) => z.zona_id === zonaId) || null
  }, [data?.zonas, zonaId])

  const nombreZonaSeleccionada = useMemo(() => {
    return zonasOrdenadas.find((z) => z.id === zonaId)?.nombre || '-'
  }, [zonasOrdenadas, zonaId])

  const tituloPeriodo = useMemo(() => {
    const monthName = MONTHS[Math.max(0, Number(mes) - 1)] || mes
    return `${monthName} ${anio}`
  }, [mes, anio])

  const productos = useMemo(() => {
    const base = data?.productos || []
    if (base.length > 0) return base
    return [
      { id: 'premium', tipo_producto: 'premium', nombre_display: 'Premium' },
      { id: 'magna', tipo_producto: 'magna', nombre_display: 'Magna' },
      { id: 'diesel', tipo_producto: 'diesel', nombre_display: 'Diesel' },
    ]
  }, [data?.productos])

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
                Reporte Conciliación
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">balance</span>
                <p className="text-base font-normal">
                  Conciliación mensual por estación ({tituloPeriodo})
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

          {isLoading || isLoadingZonas ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4]"></div>
            </div>
          ) : zonasOrdenadas.length === 0 ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-[#1a2632] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No hay zonas disponibles para mostrar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
              <div className="px-6 py-4 border-b border-[#e6e8eb] dark:border-slate-700">
                <h2 className="text-lg font-bold text-[#111418] dark:text-white">
                  Zona: {nombreZonaSeleccionada}
                </h2>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <th
                      rowSpan={2}
                      className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400 align-middle"
                    >
                      Estación
                    </th>
                    {productos.map((producto) => (
                      <th
                        key={producto.id}
                        colSpan={3}
                        className="px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400"
                      >
                        {producto.nombre_display}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400 align-middle"
                    >
                      Total
                    </th>
                    <th
                      rowSpan={2}
                      className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400 align-middle"
                    >
                      Entregado
                    </th>
                    <th
                      rowSpan={2}
                      className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400 align-middle"
                    >
                      Diferencia
                    </th>
                  </tr>
                  <tr>
                    {productos.flatMap((producto) =>
                      ['Merma Vol', 'Precio', 'Merma Monto'].map((label) => (
                        <th
                          key={`${producto.id}-${label}`}
                          className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400"
                        >
                          {label}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {(zonaSeleccionada?.estaciones || []).map((estacion) => (
                    <tr key={estacion.estacion_id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                      <td className="px-4 py-3 text-base font-semibold text-[#111418] dark:text-white">
                        {estacion.nombre}
                      </td>

                      {productos.flatMap((producto) => {
                        const valores = estacion.productos[producto.tipo_producto] || {
                          merma_volumen: 0,
                          precio: 0,
                          merma_monto: 0,
                        }
                        return [
                          <td
                            key={`${estacion.estacion_id}-${producto.id}-merma-vol`}
                            className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white"
                          >
                            {formatNumber(valores.merma_volumen, 0)}
                          </td>,
                          <td
                            key={`${estacion.estacion_id}-${producto.id}-precio`}
                            className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white"
                          >
                            {formatNumber(valores.precio, 2)}
                          </td>,
                          <td
                            key={`${estacion.estacion_id}-${producto.id}-merma-monto`}
                            className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white"
                          >
                            {formatNumber(valores.merma_monto, 0)}
                          </td>,
                        ]
                      })}

                      <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                        {formatNumber(estacion.total_merma, 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                        {formatNumber(estacion.total_entregas, 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-base font-semibold ${
                          estacion.diferencia < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                        }`}
                      >
                        {formatNumber(estacion.diferencia, 0)}
                      </td>
                    </tr>
                  ))}
                  {(zonaSeleccionada?.estaciones || []).length === 0 && (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-4 py-10 text-center text-[#617589] dark:text-slate-400"
                      >
                        No hay datos de conciliación para la zona y periodo seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-[#0f1419] border-t border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <td className="px-4 py-3 text-base font-bold text-[#111418] dark:text-white">Totales zona</td>
                    <td colSpan={productos.length * 3}></td>
                    <td className="px-4 py-3 text-right text-base font-bold text-[#111418] dark:text-white">
                      {formatNumber(zonaSeleccionada?.total_merma_zona, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-base font-bold text-[#111418] dark:text-white">
                      {formatNumber(zonaSeleccionada?.total_entregas_zona, 0)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-base font-bold ${
                        (zonaSeleccionada?.diferencia_zona || 0) < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                      }`}
                    >
                      {formatNumber(zonaSeleccionada?.diferencia_zona, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

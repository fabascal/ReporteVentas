import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import DynamicHeader from '../components/DynamicHeader'
import { reportesService } from '../services/reportesService'
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos'

type TipoProducto = 'premium' | 'magna' | 'diesel'

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

function formatNumber(value: number | undefined): string {
  return (value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatNumber2(value: number | undefined): string {
  return (value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatPercent(value: number | undefined): string {
  return `${(value ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`
}

function fallbackZonaOrder(nombre: string): number {
  const n = (nombre || '').toLowerCase()
  if (n.includes('occidente')) return 1
  if (n.includes('sur')) return 2
  if (n.includes('bajio') || n.includes('bajío')) return 3
  return 99
}

export default function DirectorReporteR() {
  const navigate = useNavigate()
  const { aniosDisponibles, anioMasReciente } = useEjerciciosActivos()

  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'))
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [producto, setProducto] = useState<TipoProducto>('premium')
  const [mostrarDetalle, setMostrarDetalle] = useState(false)

  const years = useMemo(() => {
    if (aniosDisponibles.length > 0) return aniosDisponibles
    return [anioMasReciente || new Date().getFullYear()]
  }, [aniosDisponibles, anioMasReciente])

  const { data, isLoading } = useQuery({
    queryKey: ['director-reporte-r', mes, anio, producto],
    queryFn: () => reportesService.getReporteRGeneral(mes, anio, producto),
  })

  const zonasOrdenadas = useMemo(() => {
    return [...(data?.zonas || [])].sort((a, b) => {
      const orderA = a.zona_orden ?? fallbackZonaOrder(a.zona_nombre)
      const orderB = b.zona_orden ?? fallbackZonaOrder(b.zona_nombre)
      if (orderA !== orderB) return orderA - orderB
      return a.zona_nombre.localeCompare(b.zona_nombre, 'es-MX')
    })
  }, [data?.zonas])

  const tituloPeriodo = `${MONTHS[Math.max(0, Number(mes) - 1)] || mes} ${anio}`

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
                Reporte R
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">table_view</span>
                <p className="text-base font-normal">
                  Indicadores por estación y zona ({tituloPeriodo})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#1a2632] p-4 rounded-xl shadow-sm border border-[#e6e8eb] dark:border-slate-700">
              <div className="flex gap-2">
                <button
                  onClick={() => setProducto('premium')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    producto === 'premium'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                  }`}
                >
                  Premium
                </button>
                <button
                  onClick={() => setProducto('magna')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    producto === 'magna'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                  }`}
                >
                  Magna
                </button>
                <button
                  onClick={() => setProducto('diesel')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    producto === 'diesel'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                  }`}
                >
                  Diesel
                </button>
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
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setMostrarDetalle((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  mostrarDetalle
                    ? 'bg-[#1173d4] text-white border-[#1173d4]'
                    : 'bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white border-[#e6e8eb] dark:border-slate-700'
                }`}
                title="Mostrar/Ocultar columnas de detalle"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                {mostrarDetalle ? 'Ocultar detalle' : 'Mostrar detalle'}
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1173d4]"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {zonasOrdenadas.map((zona) => (
                <section
                  key={zona.zona_id}
                  className="overflow-x-auto rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm"
                >
                  <div className="px-6 py-4 border-b border-[#e6e8eb] dark:border-slate-700">
                    <h2 className="text-lg font-bold text-[#111418] dark:text-white">{zona.zona_nombre}</h2>
                  </div>

                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          Estación
                        </th>
                        {mostrarDetalle && (
                          <>
                            <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                              I.I.B.
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                              C
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                              I.T.
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                              I.F.F.B.
                            </th>
                          </>
                        )}
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          E.E.
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          D
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          E.R.
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          V.C.
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          E.R.%
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-bold uppercase tracking-wide text-[#617589] dark:text-slate-400">
                          E.E.%
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                      {zona.estaciones.map((estacion) => (
                        <tr
                          key={estacion.estacion_id}
                          className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors"
                        >
                          <td className="px-4 py-3 text-base font-semibold text-[#111418] dark:text-white">
                            {estacion.estacion_nombre}
                          </td>
                          {mostrarDetalle && (
                            <>
                              <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                                {formatNumber(estacion.iib)}
                              </td>
                              <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                                {formatNumber(estacion.c)}
                              </td>
                              <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                                {formatNumber(estacion.it)}
                              </td>
                              <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                                {formatNumber(estacion.iffb)}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                            {formatNumber(estacion.ee)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-base font-semibold ${
                              estacion.d < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                            }`}
                          >
                            {formatNumber2(estacion.d)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-base font-semibold ${
                              estacion.er < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                            }`}
                          >
                            {formatNumber(estacion.er)}
                          </td>
                          <td className="px-4 py-3 text-right text-base font-semibold text-[#111418] dark:text-white">
                            {formatNumber(estacion.vc)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-base font-semibold ${
                              estacion.er_porcentaje < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                            }`}
                          >
                            {formatPercent(estacion.er_porcentaje)}
                          </td>
                          <td
                            className={`px-4 py-3 text-right text-base font-semibold ${
                              estacion.ee_porcentaje < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'
                            }`}
                          >
                            {formatPercent(estacion.ee_porcentaje)}
                          </td>
                        </tr>
                      ))}
                      {zona.estaciones.length === 0 && (
                        <tr>
                          <td
                            colSpan={mostrarDetalle ? 11 : 7}
                            className="px-4 py-8 text-center text-[#617589] dark:text-slate-400"
                          >
                            No hay estaciones para mostrar en esta zona.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

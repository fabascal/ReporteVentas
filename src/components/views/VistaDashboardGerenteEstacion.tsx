import React, { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../../services/reportesService'
import ejerciciosService from '../../services/ejerciciosService'
import { ReporteVentas } from '../../types/reportes'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface VistaDashboardGerenteEstacionProps {
  userRole?: string
}

interface Estacion {
  id: string
  nombre: string
  zonaNombre: string
  activa: boolean
}

const COLORS = {
  premium: '#ef4444',
  magna: '#22c55e',
  diesel: '#6b7280',
}

export default function VistaDashboardGerenteEstacion({ userRole }: VistaDashboardGerenteEstacionProps) {
  const [fechaFiltro, setFechaFiltro] = useState(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  })

  // Obtener periodos disponibles
  const { data: periodosData = [] } = useQuery({
    queryKey: ['periodos-disponibles'],
    queryFn: () => ejerciciosService.getPeriodosDisponibles(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos
    onError: (error) => {
      console.error('Error al cargar periodos disponibles:', error)
      // Si falla, el componente usará el fallback (todos los meses/años)
    }
  })

  // Obtener años disponibles únicos
  const añosDisponibles = useMemo(() => {
    if (!periodosData || !Array.isArray(periodosData)) return []
    const años = [...new Set(periodosData.map(p => p.anio))]
    return años.sort((a, b) => b - a)
  }, [periodosData])

  // Obtener meses disponibles para el año seleccionado
  const mesesDisponibles = useMemo(() => {
    if (!periodosData || !Array.isArray(periodosData)) return []
    const añoActual = new Date(fechaFiltro).getFullYear()
    return periodosData
      .filter(p => p.anio === añoActual)
      .map(p => p.mes)
      .sort((a, b) => b - a)
  }, [periodosData, fechaFiltro])

  // Obtener estaciones asignadas (solo activas)
  const { data: todasEstaciones = [], isLoading: isLoadingEstaciones } = useQuery({
    queryKey: ['estaciones'],
    queryFn: () => reportesService.getEstaciones(),
  })

  // Filtrar solo estaciones activas
  const estaciones = useMemo(() => {
    return todasEstaciones.filter((estacion) => estacion.activa)
  }, [todasEstaciones])

  // Obtener todos los reportes (sin paginación para las gráficas)
  // Para el dashboard, obtenemos todos los reportes sin filtro de estado para tener más datos
  const { data: reportesData, isLoading: isLoadingReportes } = useQuery({
    queryKey: ['reportes', 'dashboard', fechaFiltro],
    queryFn: () => reportesService.getReportes(1, 1000), // Sin filtro de estado para obtener todos los reportes disponibles
  })

  const reportes = reportesData?.data || []

  // Debug: Log para ver qué reportes se están obteniendo
  useEffect(() => {
    console.log('Dashboard - Total reportes obtenidos:', reportes.length)
    if (reportes.length > 0) {
      console.log('Dashboard - Primer reporte:', reportes[0])
      console.log('Dashboard - Estructura premium:', reportes[0].premium)
    }
  }, [reportes])

  // Filtrar reportes por fecha (mes seleccionado)
  const reportesFiltrados = useMemo(() => {
    if (!fechaFiltro || reportes.length === 0) {
      console.log('Dashboard - No hay fecha o reportes, retornando todos los reportes')
      return reportes
    }

    const fechaSeleccionada = new Date(fechaFiltro + 'T12:00:00')
    const año = fechaSeleccionada.getFullYear()
    const mes = fechaSeleccionada.getMonth() + 1

    const filtrados = reportes.filter((r) => {
      if (!r.fecha) return false
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T12:00:00')
      if (isNaN(fechaReporte.getTime())) return false
      return fechaReporte.getFullYear() === año && fechaReporte.getMonth() + 1 === mes
    })

    console.log('Dashboard - Reportes filtrados por mes:', filtrados.length, 'de', reportes.length)
    return filtrados
  }, [reportes, fechaFiltro])

  // Gráfica 1: Venta en litros por producto (agrupado por estación)
  const datosLitrosPorEstacion = useMemo(() => {
    const agrupados = new Map<string, { estacion: string; Premium: number; Magna: number; Diesel: number }>()

    reportesFiltrados.forEach((r) => {
      const estacionNombre = r.estacionNombre || 'Sin nombre'
      if (!agrupados.has(estacionNombre)) {
        agrupados.set(estacionNombre, {
          estacion: estacionNombre,
          Premium: 0,
          Magna: 0,
          Diesel: 0,
        })
      }

      const datos = agrupados.get(estacionNombre)!
      datos.Premium += r.premium?.litros || 0
      datos.Magna += r.magna?.litros || 0
      datos.Diesel += r.diesel?.litros || 0
    })

    return Array.from(agrupados.values()).sort((a, b) => {
      const totalA = a.Premium + a.Magna + a.Diesel
      const totalB = b.Premium + b.Magna + b.Diesel
      return totalB - totalA
    })
  }, [reportesFiltrados])

  // Gráfica 2: Merma en porcentaje por estación y por producto
  const datosMermaPorEstacionYProducto = useMemo(() => {
    const agrupados = new Map<
      string,
      {
        estacion: string
        Premium: { total: number; count: number }
        Magna: { total: number; count: number }
        Diesel: { total: number; count: number }
      }
    >()

    reportesFiltrados.forEach((r) => {
      const estacionNombre = r.estacionNombre || 'Sin nombre'

      if (!agrupados.has(estacionNombre)) {
        agrupados.set(estacionNombre, {
          estacion: estacionNombre,
          Premium: { total: 0, count: 0 },
          Magna: { total: 0, count: 0 },
          Diesel: { total: 0, count: 0 },
        })
      }

      const datos = agrupados.get(estacionNombre)!

      if (r.premium?.mermaPorcentaje !== undefined && r.premium.mermaPorcentaje > 0) {
        datos.Premium.total += r.premium.mermaPorcentaje
        datos.Premium.count += 1
      }
      if (r.magna?.mermaPorcentaje !== undefined && r.magna.mermaPorcentaje > 0) {
        datos.Magna.total += r.magna.mermaPorcentaje
        datos.Magna.count += 1
      }
      if (r.diesel?.mermaPorcentaje !== undefined && r.diesel.mermaPorcentaje > 0) {
        datos.Diesel.total += r.diesel.mermaPorcentaje
        datos.Diesel.count += 1
      }
    })

    // Calcular promedios y formatear para la gráfica
    return Array.from(agrupados.values())
      .map((item) => ({
        estacion: item.estacion,
        Premium: item.Premium.count > 0 ? item.Premium.total / item.Premium.count : 0,
        Magna: item.Magna.count > 0 ? item.Magna.total / item.Magna.count : 0,
        Diesel: item.Diesel.count > 0 ? item.Diesel.total / item.Diesel.count : 0,
      }))
      .filter((item) => item.Premium > 0 || item.Magna > 0 || item.Diesel > 0) // Solo estaciones con merma
      .sort((a, b) => {
        // Ordenar por promedio total de merma (de mayor a menor)
        const promedioA = (a.Premium + a.Magna + a.Diesel) / 3
        const promedioB = (b.Premium + b.Magna + b.Diesel) / 3
        return promedioB - promedioA
      })
  }, [reportesFiltrados])

  // Calcular última fecha de captura por estación
  const ultimaFechaPorEstacion = useMemo(() => {
    const fechas = new Map<string, Date>()

    reportes.forEach((r) => {
      if (!r.fecha || !r.estacionId) return

      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T12:00:00')
      
      if (isNaN(fechaReporte.getTime())) return

      const estacionId = r.estacionId
      const fechaActual = fechas.get(estacionId)

      if (!fechaActual || fechaReporte > fechaActual) {
        fechas.set(estacionId, fechaReporte)
      }
    })

    return fechas
  }, [reportes])

  // Gráfica 3: Aceites (agrupado por estación)
  const datosAceitesPorEstacion = useMemo(() => {
    const agrupados = new Map<string, { estacion: string; aceites: number }>()

    reportesFiltrados.forEach((r) => {
      if (r.aceites && r.aceites > 0) {
        const estacionNombre = r.estacionNombre || 'Sin nombre'
        if (!agrupados.has(estacionNombre)) {
          agrupados.set(estacionNombre, {
            estacion: estacionNombre,
            aceites: 0,
          })
        }

        const datos = agrupados.get(estacionNombre)!
        datos.aceites += r.aceites
      }
    })

    return Array.from(agrupados.values())
      .sort((a, b) => b.aceites - a.aceites)
      .slice(0, 10) // Top 10 estaciones
  }, [reportesFiltrados])

  // Calcular totales
  const totales = useMemo(() => {
    return reportesFiltrados.reduce(
      (acc, r) => {
        acc.premium += r.premium?.litros || 0
        acc.magna += r.magna?.litros || 0
        acc.diesel += r.diesel?.litros || 0
        acc.aceites += r.aceites || 0
        return acc
      },
      { premium: 0, magna: 0, diesel: 0, aceites: 0 }
    )
  }, [reportesFiltrados])

  const fechaSeleccionada = new Date(fechaFiltro + 'T12:00:00')
  const nombreMes = fechaSeleccionada.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  if (isLoadingEstaciones || isLoadingReportes) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#617589] dark:text-slate-400">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Dashboard de Estaciones
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <p className="text-base font-normal">Análisis de ventas y rendimiento de tus estaciones</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-[#111418] dark:text-white">
              Mes:
            </label>
            <select
              value={new Date(fechaFiltro).getMonth() + 1}
              onChange={(e) => {
                const año = new Date(fechaFiltro).getFullYear()
                const mes = e.target.value.padStart(2, '0')
                setFechaFiltro(`${año}-${mes}-01`)
              }}
              className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              {mesesDisponibles.length === 0 ? (
                <>
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </>
              ) : (
                mesesDisponibles.map((mes) => (
                  <option key={mes} value={mes}>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mes - 1]}
                  </option>
                ))
              )}
            </select>
            <select
              value={new Date(fechaFiltro).getFullYear()}
              onChange={(e) => {
                // Al cambiar el año, seleccionar el primer mes disponible de ese año
                const nuevoAño = parseInt(e.target.value)
                const mesesDelAño = periodosData?.filter(p => p.anio === nuevoAño).map(p => p.mes) || []
                const primerMes = mesesDelAño.length > 0 ? Math.max(...mesesDelAño) : new Date(fechaFiltro).getMonth() + 1
                const mes = String(primerMes).padStart(2, '0')
                setFechaFiltro(`${e.target.value}-${mes}-01`)
              }}
              className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
            >
              {añosDisponibles.length === 0 ? (
                <>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </>
              ) : (
                añosDisponibles.map((año) => (
                  <option key={año} value={año}>
                    {año}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#617589] dark:text-slate-400 bg-white dark:bg-[#1a2632] px-4 py-2 rounded-full border border-[#e6e8eb] dark:border-slate-700 shadow-sm">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span>
              Período: <span className="font-semibold text-[#111418] dark:text-white capitalize">{nombreMes}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Estaciones asignadas */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1173d4]">location_on</span>
          Mis Estaciones ({estaciones.length})
        </h2>
        {estaciones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estaciones.map((estacion) => {
              const ultimaFecha = ultimaFechaPorEstacion.get(estacion.id)
              const fechaFormateada = ultimaFecha
                ? ultimaFecha.toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Sin capturas'

              return (
                <div
                  key={estacion.id}
                  className="p-4 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-[#f8f9fa] dark:bg-[#0f1419] hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#111418] dark:text-white">{estacion.nombre}</h3>
                      <p className="text-sm text-[#617589] dark:text-slate-400">{estacion.zonaNombre}</p>
                    </div>
                    <span
                      className={`material-symbols-outlined ${
                        estacion.activa ? 'text-green-500' : 'text-gray-400'
                      }`}
                    >
                      {estacion.activa ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#e6e8eb] dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-[#1173d4] text-base">calendar_today</span>
                      <span className="text-[#617589] dark:text-slate-400">
                        Última captura:
                      </span>
                      <span className="font-semibold text-[#111418] dark:text-white capitalize">
                        {fechaFormateada}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[#617589] dark:text-slate-400">No tienes estaciones asignadas</p>
        )}
      </div>

      {/* Información de depuración - temporal */}
      {reportes.length === 0 && !isLoadingReportes && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-6">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-400">
            <span className="material-symbols-outlined">info</span>
            <p className="font-medium">No se encontraron reportes para mostrar. Asegúrate de tener reportes aprobados o rechazados en el mes seleccionado.</p>
          </div>
        </div>
      )}

      {reportesFiltrados.length === 0 && reportes.length > 0 && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
            <span className="material-symbols-outlined">info</span>
            <p className="font-medium">
              No hay reportes para el mes seleccionado ({nombreMes}). Hay {reportes.length} reportes disponibles en total.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Premium (L)</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
            {totales.premium.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Magna (L)</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight">
            {totales.magna.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/30 p-3 text-gray-600 dark:text-gray-400">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Diesel (L)</p>
          <p className="text-2xl font-black text-gray-600 dark:text-gray-400 tracking-tight">
            {totales.diesel.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-3xl">oil_barrel</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Aceites ($)</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            ${totales.aceites.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfica 1: Venta en litros por producto (por estación) */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">bar_chart</span>
            Venta en Litros por Estación - {nombreMes}
          </h3>
          {datosLitrosPorEstacion.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={datosLitrosPorEstacion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
                <XAxis
                  dataKey="estacion"
                  stroke="#617589"
                  className="dark:stroke-slate-400"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis stroke="#617589" className="dark:stroke-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e6e8eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Premium" fill={COLORS.premium} />
                <Bar dataKey="Magna" fill={COLORS.magna} />
                <Bar dataKey="Diesel" fill={COLORS.diesel} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-[#617589] dark:text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
                <p>No hay datos disponibles para este mes</p>
              </div>
            </div>
          )}
        </div>

        {/* Gráfica 2: Merma en porcentaje por estación y por producto */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">trending_down</span>
            Merma por Estación y Producto - {nombreMes}
          </h3>
          {datosMermaPorEstacionYProducto.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={datosMermaPorEstacionYProducto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
                <XAxis
                  dataKey="estacion"
                  stroke="#617589"
                  className="dark:stroke-slate-400"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                />
                <YAxis stroke="#617589" className="dark:stroke-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e6e8eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                />
                <Legend />
                <Bar dataKey="Premium" fill={COLORS.premium} />
                <Bar dataKey="Magna" fill={COLORS.magna} />
                <Bar dataKey="Diesel" fill={COLORS.diesel} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-[#617589] dark:text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">trending_down</span>
                <p>No hay datos de merma disponibles para este mes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfica 3: Aceites */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1173d4]">oil_barrel</span>
          Ventas de Aceites por Estación - {nombreMes}
        </h3>
        {datosAceitesPorEstacion.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={datosAceitesPorEstacion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="estacion"
                stroke="#617589"
                className="dark:stroke-slate-400"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#617589" className="dark:stroke-slate-400" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e6e8eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Bar dataKey="aceites" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[350px] flex items-center justify-center text-[#617589] dark:text-slate-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4">oil_barrel</span>
              <p>No hay datos de aceites disponibles para este mes</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

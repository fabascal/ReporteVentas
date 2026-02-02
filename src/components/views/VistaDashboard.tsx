import React, { useMemo } from 'react'
import { ReporteVentas } from '../../types/reportes'
import { useEjerciciosActivos } from '../../hooks/useEjerciciosActivos'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface VistaDashboardProps {
  totalesAcumulados: { premium: number; magna: number; diesel: number }
  totalesDia: { premium: number; magna: number; diesel: number }
  totalGeneralAcumulado: number
  totalGeneralDia: number
  datosPreciosPorDia: Array<{ dia: string; Premium: number; Magna: number; Diesel: number }>
  datosLitrosPorZona: Array<{ zona: string; Premium: number; Magna: number; Diesel: number }>
  datosMermaPorEstacion: Array<{ estacion: string; Premium: number; Magna: number; Diesel: number }>
  datosTopEstaciones: Array<{ estacion: string; zona: string; 'Total Ventas': number }>
  fechaFiltro: string
  setFechaFiltro: (fecha: string) => void
  reportesAcumulados: ReporteVentas[]
  reportesDiaSeleccionado: ReporteVentas[]
  estadoPeriodo?: {
    esta_cerrado: boolean
    fecha_cierre?: string
    cerrado_por?: string
    mensaje: string
  }
  onOpenCierre: () => void
}

const VistaDashboard: React.FC<VistaDashboardProps> = ({
  totalesAcumulados,
  totalesDia,
  totalGeneralAcumulado,
  totalGeneralDia,
  datosPreciosPorDia,
  datosLitrosPorZona,
  datosMermaPorEstacion,
  datosTopEstaciones,
  fechaFiltro,
  setFechaFiltro,
  reportesAcumulados,
  reportesDiaSeleccionado,
  estadoPeriodo,
  onOpenCierre,
}) => {
  const { aniosDisponibles } = useEjerciciosActivos()
  
  // Usar mediodía para evitar problemas de zona horaria
  const fechaSeleccionada = new Date(fechaFiltro + 'T12:00:00')
  const nombreMes = fechaSeleccionada.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  
  // Extraer mes y año del fechaFiltro para los selectores
  const mesActual = parseInt(fechaFiltro.split('-')[1])
  const anioActual = parseInt(fechaFiltro.split('-')[0])
  
  const handleMesChange = (nuevoMes: number) => {
    const fecha = `${anioActual}-${String(nuevoMes).padStart(2, '0')}-01`
    setFechaFiltro(fecha)
  }
  
  const handleAnioChange = (nuevoAnio: number) => {
    const fecha = `${nuevoAnio}-${String(mesActual).padStart(2, '0')}-01`
    setFechaFiltro(fecha)
  }
  
  const getMesNombre = (): string[] => {
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  }
  
  // Calcular el último día del mes que tiene reportes
  const diaSeleccionado = useMemo(() => {
    if (reportesAcumulados.length === 0) return 1
    const dias = reportesAcumulados.map((r) => {
      if (!r.fecha) return 0
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T00:00:00')
      return isNaN(fechaReporte.getTime()) ? 0 : fechaReporte.getDate()
    })
    return Math.max(...dias.filter(d => d > 0), 1)
  }, [reportesAcumulados])

  return (
    <>
      {/* Page Heading */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
            Dashboard Analítico
          </h1>
          <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <p className="text-base font-normal">Análisis y comparación de ventas por fecha</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-[#60758a] dark:text-gray-400 mb-1">
              Mes
            </label>
            <select
              value={mesActual}
              onChange={(e) => handleMesChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-[#e6e8eb] dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {getMesNombre().map((mes, index) => (
                <option key={index + 1} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#60758a] dark:text-gray-400 mb-1">
              Año
            </label>
            <select
              value={anioActual}
              onChange={(e) => handleAnioChange(parseInt(e.target.value))}
              className="px-3 py-2 border border-[#e6e8eb] dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {aniosDisponibles.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#617589] dark:text-slate-400 bg-white dark:bg-[#1a2632] px-4 py-2 rounded-full border border-[#e6e8eb] dark:border-slate-700 shadow-sm">
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            <span>
              Período: <span className="font-semibold text-[#111418] dark:text-white capitalize">{nombreMes}</span>
            </span>
          </div>
          
          <button
            onClick={onOpenCierre}
            disabled={estadoPeriodo?.esta_cerrado}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm ${
              estadoPeriodo?.esta_cerrado
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title={estadoPeriodo?.esta_cerrado ? 'El periodo operativo ya está cerrado' : 'Abrir modal de cierre mensual'}
          >
            <span className="material-symbols-outlined text-lg">
              {estadoPeriodo?.esta_cerrado ? 'lock' : 'lock_open'}
            </span>
            <span>Cierre Mensual</span>
          </button>
        </div>
      </div>

      {/* Banner de periodo cerrado */}
      {estadoPeriodo?.esta_cerrado && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">info</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Periodo Operativo Cerrado
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Este periodo ya ha sido cerrado y no permite realizar el cierre mensual nuevamente.
                {estadoPeriodo.cerrado_por && (
                  <span className="block mt-1">
                    Cerrado por: <strong>{estadoPeriodo.cerrado_por}</strong>
                  </span>
                )}
                {estadoPeriodo.fecha_cierre && (
                  <span className="block">
                    Fecha: <strong>{new Date(estadoPeriodo.fecha_cierre).toLocaleString('es-MX')}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards - Totales del Mes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-red-500/20 group-hover:bg-red-500 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-red-600 dark:text-red-400">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Premium</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">
            ${totalesAcumulados.premium.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
            <p className="text-xs text-[#617589] dark:text-slate-400">Acumulado (1-{diaSeleccionado})</p>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              Día {diaSeleccionado}: ${totalesDia.premium.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500/20 group-hover:bg-green-500 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-3 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Magna</p>
          <p className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight">
            ${totalesAcumulados.magna.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-[#617589] dark:text-slate-400">Acumulado (1-{diaSeleccionado})</p>
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">
              Día {diaSeleccionado}: ${totalesDia.magna.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-500/20 group-hover:bg-gray-500 transition-colors"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/30 p-3 text-gray-700 dark:text-gray-300">
              <span className="material-symbols-outlined text-3xl">local_gas_station</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Diesel</p>
          <p className="text-2xl font-black text-gray-700 dark:text-gray-300 tracking-tight">
            ${totalesAcumulados.diesel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-[#617589] dark:text-slate-400">Acumulado (1-{diaSeleccionado})</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Día {diaSeleccionado}: ${totalesDia.diesel.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-[#1173d4] dark:border-[#1173d4] bg-[#1173d4]/5 dark:bg-[#1173d4]/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="rounded-lg bg-[#1173d4]/20 dark:bg-[#1173d4]/30 p-3 text-[#1173d4]">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
          </div>
          <p className="text-sm font-medium text-[#617589] dark:text-slate-400 mb-1">Total General</p>
          <p className="text-2xl font-black text-[#1173d4] tracking-tight">
            ${totalGeneralAcumulado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-[#617589] dark:text-slate-400">Acumulado (1-{diaSeleccionado})</p>
            <p className="text-xs font-semibold text-[#1173d4]">
              Día {diaSeleccionado}: ${totalGeneralDia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfica de Precios Promedio por Día */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">show_chart</span>
            Precios Promedio por Día - {nombreMes}
          </h3>
          {datosPreciosPorDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datosPreciosPorDia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="dia" stroke="#617589" className="dark:stroke-slate-400" />
                <YAxis stroke="#617589" className="dark:stroke-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e6e8eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="Premium" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Magna" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="Diesel" stroke="#6b7280" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#617589] dark:text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
                <p>No hay datos disponibles para este mes</p>
              </div>
            </div>
          )}
        </div>

        {/* Gráfica de Litros Vendidos por Zona */}
        <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">water_drop</span>
            Litros Vendidos por Zona - {nombreMes}
          </h3>
          {datosLitrosPorZona.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosLitrosPorZona}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
                <XAxis dataKey="zona" stroke="#617589" className="dark:stroke-slate-400" />
                <YAxis stroke="#617589" className="dark:stroke-slate-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e6e8eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value ? `${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })} L` : '0 L'}
                />
                <Legend />
                <Bar dataKey="Premium" fill="#ef4444" />
                <Bar dataKey="Magna" fill="#22c55e" />
                <Bar dataKey="Diesel" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[#617589] dark:text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
                <p>No hay datos disponibles para este mes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Merma por Estación */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ef4444]">warning</span>
          Merma por Estación (%) - {nombreMes}
        </h3>
        {datosMermaPorEstacion.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={Math.max(400, datosMermaPorEstacion.length * 35)}>
              <BarChart 
                data={datosMermaPorEstacion} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
                <XAxis 
                  type="number" 
                  stroke="#617589" 
                  className="dark:stroke-slate-400"
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis 
                  type="category" 
                  dataKey="estacion" 
                  stroke="#617589" 
                  className="dark:stroke-slate-400"
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e6e8eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value ? `${value.toFixed(2)}%` : '0.00%'}
                />
                <Legend />
                <Bar dataKey="Premium" fill="#ef4444" name="Premium" />
                <Bar dataKey="Magna" fill="#22c55e" name="Magna" />
                <Bar dataKey="Diesel" fill="#6b7280" name="Diesel" />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla completa de todas las estaciones */}
            <div className="mt-6">
              <h4 className="text-md font-semibold text-[#111418] dark:text-white mb-3">Todas las Estaciones</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Estación
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Premium (%)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Magna (%)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Diesel (%)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Promedio (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-[#1a2632] divide-y divide-gray-200 dark:divide-gray-700">
                    {datosMermaPorEstacion.map((estacion, index) => {
                      const promedio = (estacion.Premium + estacion.Magna + estacion.Diesel) / 3
                      const bgColor = promedio > 6 ? 'bg-red-50 dark:bg-red-900/20' : 
                                     promedio > 4 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                                     'bg-green-50 dark:bg-green-900/20'
                      return (
                        <tr key={estacion.estacion} className={bgColor}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {estacion.estacion}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                            {estacion.Premium.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                            {estacion.Magna.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                            {estacion.Diesel.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                            {promedio.toFixed(2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-[#617589] dark:text-slate-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
              <p>No hay datos de merma disponibles para este mes</p>
            </div>
          </div>
        )}
      </div>

      {/* Gráfica de Top 10 Estaciones */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1173d4]">star</span>
          Top 10 Estaciones por Ventas - {nombreMes}
        </h3>
        {datosTopEstaciones.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={datosTopEstaciones} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8eb" className="dark:stroke-slate-700" />
              <XAxis type="number" stroke="#617589" className="dark:stroke-slate-400" />
              <YAxis dataKey="estacion" type="category" stroke="#617589" className="dark:stroke-slate-400" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e6e8eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined) => value ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00'}
                labelFormatter={(label) => `Estación: ${label}`}
              />
              <Bar dataKey="Total Ventas" fill="#1173d4" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-[#617589] dark:text-slate-400">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
              <p>No hay datos disponibles para este mes</p>
            </div>
          </div>
        )}
      </div>

      {/* Resumen de Reportes del Mes */}
      <div className="rounded-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1173d4]">description</span>
          Resumen de Reportes del Mes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Total de Reportes</p>
            <p className="text-2xl font-black text-[#111418] dark:text-white">{reportesAcumulados.length}</p>
            <p className="text-xs text-[#617589] dark:text-slate-400 mt-1">Día {diaSeleccionado}: {reportesDiaSeleccionado.length}</p>
          </div>
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Estaciones Activas</p>
            <p className="text-2xl font-black text-[#111418] dark:text-white">
              {new Set(reportesAcumulados.map((r) => r.estacionNombre)).size}
            </p>
          </div>
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
            <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Promedio por Reporte</p>
            <p className="text-2xl font-black text-[#111418] dark:text-white">
              ${reportesAcumulados.length > 0 ? (totalGeneralAcumulado / reportesAcumulados.length).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default VistaDashboard


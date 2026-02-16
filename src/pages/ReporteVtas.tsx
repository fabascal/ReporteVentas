import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types/auth'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../types/reportes'
import DynamicHeader from '../components/DynamicHeader'
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos'

type TipoProducto = 'premium' | 'magna' | 'diesel'

export default function ReporteVtas() {
  const { user } = useAuth()
  
  // Estado para filtros
  const [estacionId, setEstacionId] = useState('')
  const [mes, setMes] = useState(() => {
    const now = new Date()
    return String(now.getMonth() + 1).padStart(2, '0')
  })
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [productoSeleccionado, setProductoSeleccionado] = useState<TipoProducto>('premium')

  // Obtener ejercicios activos para el selector de año
  const { ejercicios: ejerciciosActivos } = useEjerciciosActivos()

  // Obtener estaciones disponibles
  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones'],
    queryFn: reportesService.getEstaciones,
  })

  // Pre-seleccionar estación si hay una sola (Gerente Estación)
  useEffect(() => {
    if (estaciones.length > 0 && !estacionId) {
      if (user?.role === Role.GerenteEstacion && estaciones.length === 1) {
        setEstacionId(estaciones[0].id)
      } else if (estaciones.length > 0) {
        setEstacionId(estaciones[0].id)
      }
    }
  }, [estaciones, user, estacionId])

  // Obtener reportes aprobados filtrados
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes-vtas', estacionId, mes, anio],
    queryFn: async () => {
      const primerDia = new Date(parseInt(anio), parseInt(mes) - 1, 1)
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0)
      const fechaInicio = primerDia.toISOString().split('T')[0]
      const fechaFin = ultimoDia.toISOString().split('T')[0]
      
      return await reportesService.getReportes(
        1,
        100, // Suficiente para todo el mes
        EstadoReporte.Aprobado,
        undefined,
        estacionId || undefined,
        fechaInicio,
        fechaFin
      )
    },
    enabled: !!estacionId // Solo buscar si hay estación seleccionada
  })

  // Ordenar reportes por fecha ascendente
  const reportes = (reportesData?.data || []).sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  })

  const getMesNombre = (mesStr: string) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return meses[parseInt(mesStr) - 1] || mesStr
  }

  const getYearOptions = () => {
    return ejerciciosActivos?.map(e => e.anio) || []
  }

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00'
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)
  }

  // Calcular totales
  const calcularTotales = () => {
    return reportes.reduce((acc, reporte) => {
      const producto = reporte[productoSeleccionado]
      if (producto) {
        acc.litros += producto.litros || 0
        acc.mermaVolumen += producto.mermaVolumen || 0
        acc.iib += producto.iib || 0
        acc.compras += producto.compras || 0
        acc.cct += producto.cct || 0
        acc.vDsc += producto.vDsc || 0
        acc.dc += producto.dc || 0
        acc.difVDsc += producto.difVDsc || 0
        acc.v += (producto.litros || 0) - (producto.mermaVolumen || 0)
        acc.iffb += producto.iffb || 0
        acc.eficienciaReal += producto.eficienciaReal || 0
        acc.eficienciaImporte += producto.eficienciaImporte || 0
      }
      return acc
    }, {
      litros: 0, mermaVolumen: 0, iib: 0, compras: 0, cct: 0, vDsc: 0, dc: 0, difVDsc: 0,
      v: 0, iffb: 0, eficienciaReal: 0, eficienciaImporte: 0
    })
  }

  const totales = calcularTotales()

  // Calcular promedios para porcentajes
  const promedioER = reportes.length > 0
    ? reportes.reduce((sum, r) => sum + (r[productoSeleccionado]?.eficienciaRealPorcentaje || 0), 0) / reportes.length
    : 0

  const promedioMerma = reportes.length > 0
    ? reportes.reduce((sum, r) => sum + (r[productoSeleccionado]?.mermaPorcentaje || 0), 0) / reportes.length
    : 0

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      {/* Usar DynamicHeader directamente para asegurar navegación correcta */}
      <DynamicHeader />
      
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[95%] mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                Reporte de Ventas
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <p className="text-base font-normal">Consulta mensual de ventas por estación</p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[#1a2632] p-4 rounded-xl shadow-sm border border-[#e6e8eb] dark:border-slate-700">
              {/* Selector Estación */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">Estación</label>
                <select
                  value={estacionId}
                  onChange={(e) => setEstacionId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  <option value="">Seleccionar estación...</option>
                  {estaciones.map(estacion => (
                    <option key={estacion.id} value={estacion.id}>{estacion.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Selector Mes */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">Mes</label>
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{getMesNombre(m)}</option>
                  ))}
                </select>
              </div>

              {/* Selector Año */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase">Año</label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-gray-50 dark:bg-[#0d1b2a] text-[#111418] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
                >
                  {getYearOptions().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {!estacionId ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-[#1a2632] rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">storefront</span>
                <p>Selecciona una estación para ver el reporte mensual.</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Título, Filtros y Exportación Unificados */}
              <div className="bg-white dark:bg-[#1a2632] rounded-t-xl p-6 shadow-sm border border-[#e6e8eb] dark:border-slate-700 border-b-0">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  {/* Filtros de Producto a la Izquierda */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProductoSeleccionado('premium')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        productoSeleccionado === 'premium'
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                      }`}
                    >
                      Premium
                    </button>
                    <button
                      onClick={() => setProductoSeleccionado('magna')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        productoSeleccionado === 'magna'
                          ? 'bg-green-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                      }`}
                    >
                      Magna
                    </button>
                    <button
                      onClick={() => setProductoSeleccionado('diesel')}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        productoSeleccionado === 'diesel'
                          ? 'bg-gray-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#0d1b2a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#1a2632]'
                      }`}
                    >
                      Diésel
                    </button>
                  </div>

                  {/* Título al Centro */}
                  <h2 className="text-lg font-bold text-[#111418] dark:text-white whitespace-nowrap">
                    {estaciones.find(e => e.id === estacionId)?.nombre} - {productoSeleccionado.charAt(0).toUpperCase() + productoSeleccionado.slice(1)} - {getMesNombre(mes)} {anio}
                  </h2>

                  {/* Botones de Exportación a la Derecha */}
                  <div className="flex gap-2">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                      title="Exportar a Excel"
                    >
                      <span className="material-symbols-outlined">file_download</span>
                      <span className="font-medium">Excel</span>
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                      title="Exportar a PDF"
                    >
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      <span className="font-medium">PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla Detallada */}
              <div className="overflow-x-auto rounded-b-xl border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold">FECHA</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">LTS</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">MERMA VOL.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">PRECIO</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">I.I.B.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">C</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">C.C.T.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">V.DSC</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">DC</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">DIF V.DSC</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">V</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">I.F.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">I.F.F.B.</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">ER</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">ER%</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">E</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">E%</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">*</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                    {reportes.map((reporte) => {
                      const producto = reporte[productoSeleccionado]
                      if (!producto) return null

                      return (
                        <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                          <td className="px-3 py-2 font-medium text-[#111418] dark:text-white">
                            {new Date(reporte.fecha).getDate()} {getMesNombre(mes).substring(0, 3).toLowerCase()}
                          </td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.litros)}</td>
                          <td className={`px-3 py-2 text-right ${(producto.mermaVolumen || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.mermaVolumen)}</td>
                          <td className="px-3 py-2 text-right">${formatNumber(producto.precio)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.iib)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.compras)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.cct)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.vDsc)}</td>
                          <td className={`px-3 py-2 text-right ${(producto.dc || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.dc)}</td>
                          <td className={`px-3 py-2 text-right ${(producto.difVDsc || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.difVDsc)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber((producto.litros || 0) - (producto.mermaVolumen || 0))}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.if)}</td>
                          <td className="px-3 py-2 text-right">{formatNumber(producto.iffb)}</td>
                          <td className={`px-3 py-2 text-right ${(producto.eficienciaReal || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.eficienciaReal)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${(producto.eficienciaRealPorcentaje || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatNumber(producto.eficienciaRealPorcentaje)}%
                          </td>
                          <td className={`px-3 py-2 text-right ${(producto.mermaVolumen || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.mermaVolumen)}</td>
                          <td className={`px-3 py-2 text-right ${(producto.mermaPorcentaje || 0) < 0 ? 'text-red-600 font-semibold' : ''}`}>{formatNumber(producto.mermaPorcentaje)}%</td>
                          <td className={`px-3 py-2 text-right font-semibold ${((producto.eficienciaReal || 0) - (producto.mermaVolumen || 0)) < 0 ? 'text-red-600' : ''}`}>
                            {formatNumber((producto.eficienciaReal || 0) - (producto.mermaVolumen || 0))}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${(() => {
                            const v = (producto.litros || 0) - (producto.mermaVolumen || 0)
                            const mas = (producto.eficienciaReal || 0) - (producto.mermaVolumen || 0)
                            const porcentaje = v !== 0 ? (mas / v) * 100 : 0
                            return porcentaje < 0 ? 'text-red-600' : ''
                          })()}`}>
                            {(() => {
                              const v = (producto.litros || 0) - (producto.mermaVolumen || 0)
                              const mas = (producto.eficienciaReal || 0) - (producto.mermaVolumen || 0)
                              const porcentaje = v !== 0 ? (mas / v) * 100 : 0
                              return formatNumber(porcentaje)
                            })()}%
                          </td>
                        </tr>
                      )
                    })}
                    {/* Fila de Totales */}
                    <tr className="bg-gray-100 dark:bg-[#0d1b2a] font-bold border-t-2 border-gray-300 dark:border-gray-600">
                      <td className="px-3 py-3 text-[#111418] dark:text-white">TOTALES</td>
                      <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.litros)}</td>
                      <td className={`px-3 py-3 text-right ${totales.mermaVolumen < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(totales.mermaVolumen)}</td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.compras)}</td>
                      <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.cct)}</td>
                      <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.vDsc)}</td>
                      <td className={`px-3 py-3 text-right ${totales.dc < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(totales.dc)}</td>
                      <td className={`px-3 py-3 text-right ${totales.difVDsc < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(totales.difVDsc)}</td>
                      <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.v)}</td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className="px-3 py-3 text-right">-</td>
                      <td className={`px-3 py-3 text-right ${totales.eficienciaReal < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(totales.eficienciaReal)}</td>
                      <td className={`px-3 py-3 text-right ${promedioER >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(promedioER)}%
                      </td>
                      <td className={`px-3 py-3 text-right ${totales.mermaVolumen < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(totales.mermaVolumen)}</td>
                      <td className={`px-3 py-3 text-right ${promedioMerma < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>{formatNumber(promedioMerma)}%</td>
                      <td className={`px-3 py-3 text-right ${(totales.eficienciaReal - totales.mermaVolumen) < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>
                        {formatNumber(totales.eficienciaReal - totales.mermaVolumen)}
                      </td>
                      <td className={`px-3 py-3 text-right ${((totales.eficienciaReal - totales.mermaVolumen) / (totales.v - totales.mermaVolumen) * 100) < 0 ? 'text-red-600' : 'text-[#111418] dark:text-white'}`}>
                        {formatNumber(((totales.eficienciaReal - totales.mermaVolumen) / (totales.v - totales.mermaVolumen)) * 100)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

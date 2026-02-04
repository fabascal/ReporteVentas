import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types/auth'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../types/reportes'
import DynamicHeader from '../components/DynamicHeader'

export default function ReporteEficiencia() {
  const { user } = useAuth()
  
  // Estado para filtros
  const [estacionId, setEstacionId] = useState('')
  const [mes, setMes] = useState(() => {
    const now = new Date()
    return String(now.getMonth() + 1).padStart(2, '0')
  })
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()))
  const [mostrarPrecios, setMostrarPrecios] = useState(false)

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
    queryKey: ['reportes-eficiencia', estacionId, mes, anio],
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
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00'
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.0%'
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) + '%'
  }

  // Sistema de colores para precios
  const coloresPaleta = [
    '#06b6d4', // cyan-500
    '#eab308', // yellow-500
    '#f97316', // orange-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f59e0b', // amber-500
    '#a855f7', // purple-500
    '#6366f1', // indigo-500
    '#84cc16', // lime-500
    '#0ea5e9', // sky-500
    '#f43f5e', // rose-500
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#ef4444', // red-500
  ]

  // Función para asignar colores a precios sin duplicar entre productos
  const asignarColoresPrecios = () => {
    const coloresUsados = new Set<string>()
    const mapeoColores: Record<string, Record<number, string>> = {
      premium: {},
      magna: {},
      diesel: {}
    }
    let indiceColor = 0

    // Recopilar todos los precios únicos por producto
    const preciosPorProducto: Record<string, Set<number>> = {
      premium: new Set(),
      magna: new Set(),
      diesel: new Set()
    }

    reportes.forEach(reporte => {
      if (reporte.premium?.precio) preciosPorProducto.premium.add(reporte.premium.precio)
      if (reporte.magna?.precio) preciosPorProducto.magna.add(reporte.magna.precio)
      if (reporte.diesel?.precio) preciosPorProducto.diesel.add(reporte.diesel.precio)
    })

    // Asignar colores a cada precio único por producto
    const productos = ['premium', 'magna', 'diesel'] as const
    productos.forEach(producto => {
      const preciosOrdenados = Array.from(preciosPorProducto[producto]).sort((a, b) => a - b)
      preciosOrdenados.forEach(precio => {
        // Buscar un color que no esté usado
        let color = coloresPaleta[indiceColor % coloresPaleta.length]
        let intentos = 0
        while (coloresUsados.has(color) && intentos < coloresPaleta.length) {
          indiceColor++
          color = coloresPaleta[indiceColor % coloresPaleta.length]
          intentos++
        }
        mapeoColores[producto][precio] = color
        coloresUsados.add(color)
        indiceColor++
      })
    })

    return mapeoColores
  }

  const coloresPrecios = asignarColoresPrecios()

  const obtenerColorPrecio = (producto: 'premium' | 'magna' | 'diesel', precio: number | undefined): string => {
    if (!precio) return '#6b7280' // gray-500 por defecto
    return coloresPrecios[producto][precio] || '#6b7280'
  }

  // Calcular totales
  const calcularTotales = () => {
    return reportes.reduce((acc, reporte) => {
      acc.ePremium += reporte.premium?.mermaVolumen || 0
      acc.eMagna += reporte.magna?.mermaVolumen || 0
      acc.eDiesel += reporte.diesel?.mermaVolumen || 0
      acc.totalMerma += (reporte.premium?.mermaVolumen || 0) + (reporte.magna?.mermaVolumen || 0) + (reporte.diesel?.mermaVolumen || 0)
      acc.mermaPremiumPesos += reporte.premium?.mermaImporte || 0
      acc.mermaMagnaPesos += reporte.magna?.mermaImporte || 0
      acc.mermaDieselPesos += reporte.diesel?.mermaImporte || 0
      acc.totalPesos += (reporte.premium?.mermaImporte || 0) + (reporte.magna?.mermaImporte || 0) + (reporte.diesel?.mermaImporte || 0)
      return acc
    }, {
      ePremium: 0,
      eMagna: 0,
      eDiesel: 0,
      totalMerma: 0,
      mermaPremiumPesos: 0,
      mermaMagnaPesos: 0,
      mermaDieselPesos: 0,
      totalPesos: 0
    })
  }

  const totales = calcularTotales()

  // Calcular promedios para porcentajes (E / V)
  const promedioEfPremiumPct = reportes.length > 0
    ? reportes.reduce((sum, r) => {
        const merma = r.premium?.mermaVolumen || 0
        const litros = r.premium?.litros || 0
        const v = litros - merma
        const porcentaje = v !== 0 ? (merma / v) * 100 : 0
        return sum + porcentaje
      }, 0) / reportes.length
    : 0

  const promedioEfMagnaPct = reportes.length > 0
    ? reportes.reduce((sum, r) => {
        const merma = r.magna?.mermaVolumen || 0
        const litros = r.magna?.litros || 0
        const v = litros - merma
        const porcentaje = v !== 0 ? (merma / v) * 100 : 0
        return sum + porcentaje
      }, 0) / reportes.length
    : 0

  const promedioEfDieselPct = reportes.length > 0
    ? reportes.reduce((sum, r) => {
        const merma = r.diesel?.mermaVolumen || 0
        const litros = r.diesel?.litros || 0
        const v = litros - merma
        const porcentaje = v !== 0 ? (merma / v) * 100 : 0
        return sum + porcentaje
      }, 0) / reportes.length
    : 0

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />
      
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[95%] mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#111418] dark:text-white">
                Reporte de Eficiencia Mensual
              </h1>
              <div className="flex items-center gap-2 text-[#617589] dark:text-slate-400 mt-2">
                <span className="material-symbols-outlined text-[20px]">monitoring</span>
                <p className="text-base font-normal">Análisis mensual de eficiencia por producto</p>
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
                <p>Selecciona una estación para ver el reporte de eficiencia.</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Título y Botones de Exportación */}
              <div className="bg-white dark:bg-[#1a2632] rounded-t-xl p-6 shadow-sm border border-[#e6e8eb] dark:border-slate-700 border-b-0">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-lg font-bold text-[#111418] dark:text-white">
                    Datos del Reporte
                  </h2>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMostrarPrecios(!mostrarPrecios)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
                        mostrarPrecios
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      }`}
                      title={mostrarPrecios ? 'Ocultar Precios' : 'Mostrar Precios'}
                    >
                      <span className="material-symbols-outlined">
                        {mostrarPrecios ? 'visibility_off' : 'visibility'}
                      </span>
                      <span className="font-medium">
                        {mostrarPrecios ? 'Ocultar' : 'Mostrar'} Precios
                      </span>
                    </button>
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
                <table className="w-full text-left text-sm text-[#617589] dark:text-slate-400">
                  <thead className="bg-gray-50 dark:bg-[#101922] text-xs uppercase text-[#617589] dark:text-slate-500 font-bold border-b border-[#e6e8eb] dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-3">DÍA</th>
                      <th className="px-3 py-3 text-right">EP (VOL)</th>
                      <th className="px-3 py-3 text-right">EM (VOL)</th>
                      <th className="px-3 py-3 text-right">ED (VOL)</th>
                      <th className="px-3 py-3 text-right bg-gray-100 dark:bg-[#1a2632]">TOTAL MERMA</th>
                      {mostrarPrecios && (
                        <>
                          <th className="px-3 py-3 text-right">PR. P</th>
                          <th className="px-3 py-3 text-right">PR. M</th>
                          <th className="px-3 py-3 text-right">PR. D</th>
                        </>
                      )}
                      <th className="px-3 py-3 text-right">EF. P ($)</th>
                      <th className="px-3 py-3 text-right">EF. M ($)</th>
                      <th className="px-3 py-3 text-right">EF. D ($)</th>
                      <th className="px-3 py-3 text-right bg-gray-100 dark:bg-[#1a2632]">TOTAL ($)</th>
                      <th className="px-3 py-3 text-right">EF. P (%)</th>
                      <th className="px-3 py-3 text-right">EF. M (%)</th>
                      <th className="px-3 py-3 text-right">EF. D (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                    {reportes.length === 0 ? (
                      <tr>
                        <td colSpan={mostrarPrecios ? 15 : 12} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          No hay reportes de eficiencia disponibles para mostrar.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {reportes.map((reporte) => {
                          const dia = new Date(reporte.fecha).getDate()
                          const totalMerma = (reporte.premium?.mermaVolumen || 0) + 
                                           (reporte.magna?.mermaVolumen || 0) + 
                                           (reporte.diesel?.mermaVolumen || 0)
                          const totalPesos = (reporte.premium?.mermaImporte || 0) + 
                                           (reporte.magna?.mermaImporte || 0) + 
                                           (reporte.diesel?.mermaImporte || 0)
                          
                          return (
                            <tr key={reporte.id} className="hover:bg-gray-50 dark:hover:bg-[#1a2632] transition-colors">
                              <td className="px-3 py-2 font-medium text-[#111418] dark:text-white">{dia}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(reporte.premium?.mermaVolumen)}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(reporte.magna?.mermaVolumen)}</td>
                              <td className="px-3 py-2 text-right">{formatNumber(reporte.diesel?.mermaVolumen)}</td>
                              <td className="px-3 py-2 text-right font-semibold bg-gray-50 dark:bg-[#1a2632]">{formatNumber(totalMerma)}</td>
                              {mostrarPrecios && (
                                <>
                                  <td 
                                    className="px-3 py-2 text-right font-semibold text-white"
                                    style={{ backgroundColor: obtenerColorPrecio('premium', reporte.premium?.precio) }}
                                  >
                                    ${formatNumber(reporte.premium?.precio)}
                                  </td>
                                  <td 
                                    className="px-3 py-2 text-right font-semibold text-white"
                                    style={{ backgroundColor: obtenerColorPrecio('magna', reporte.magna?.precio) }}
                                  >
                                    ${formatNumber(reporte.magna?.precio)}
                                  </td>
                                  <td 
                                    className="px-3 py-2 text-right font-semibold text-white"
                                    style={{ backgroundColor: obtenerColorPrecio('diesel', reporte.diesel?.precio) }}
                                  >
                                    ${formatNumber(reporte.diesel?.precio)}
                                  </td>
                                </>
                              )}
                              <td className="px-3 py-2 text-right">${formatNumber(reporte.premium?.mermaImporte)}</td>
                              <td className="px-3 py-2 text-right">${formatNumber(reporte.magna?.mermaImporte)}</td>
                              <td className="px-3 py-2 text-right">${formatNumber(reporte.diesel?.mermaImporte)}</td>
                              <td className="px-3 py-2 text-right font-semibold bg-gray-50 dark:bg-[#1a2632]">${formatNumber(totalPesos)}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${(() => {
                                const merma = reporte.premium?.mermaVolumen || 0
                                const litros = reporte.premium?.litros || 0
                                const v = litros - merma
                                const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                return porcentaje >= 0 ? 'text-green-600' : 'text-red-600'
                              })()}`}>
                                {(() => {
                                  const merma = reporte.premium?.mermaVolumen || 0
                                  const litros = reporte.premium?.litros || 0
                                  const v = litros - merma
                                  const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                  return formatPercentage(porcentaje)
                                })()}
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold ${(() => {
                                const merma = reporte.magna?.mermaVolumen || 0
                                const litros = reporte.magna?.litros || 0
                                const v = litros - merma
                                const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                return porcentaje >= 0 ? 'text-green-600' : 'text-red-600'
                              })()}`}>
                                {(() => {
                                  const merma = reporte.magna?.mermaVolumen || 0
                                  const litros = reporte.magna?.litros || 0
                                  const v = litros - merma
                                  const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                  return formatPercentage(porcentaje)
                                })()}
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold ${(() => {
                                const merma = reporte.diesel?.mermaVolumen || 0
                                const litros = reporte.diesel?.litros || 0
                                const v = litros - merma
                                const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                return porcentaje >= 0 ? 'text-green-600' : 'text-red-600'
                              })()}`}>
                                {(() => {
                                  const merma = reporte.diesel?.mermaVolumen || 0
                                  const litros = reporte.diesel?.litros || 0
                                  const v = litros - merma
                                  const porcentaje = v !== 0 ? (merma / v) * 100 : 0
                                  return formatPercentage(porcentaje)
                                })()}
                              </td>
                            </tr>
                          )
                        })}

                        {/* Fila de Totales */}
                        <tr className="bg-gray-100 dark:bg-[#0d1b2a] font-bold border-t-2 border-gray-300 dark:border-gray-600">
                          <td className="px-3 py-3 text-[#111418] dark:text-white">TOTALES</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.ePremium)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.eMagna)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">{formatNumber(totales.eDiesel)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white bg-gray-200 dark:bg-[#1a2632]">{formatNumber(totales.totalMerma)}</td>
                          {mostrarPrecios && (
                            <>
                              <td className="px-3 py-3 text-right">-</td>
                              <td className="px-3 py-3 text-right">-</td>
                              <td className="px-3 py-3 text-right">-</td>
                            </>
                          )}
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">${formatNumber(totales.mermaPremiumPesos)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">${formatNumber(totales.mermaMagnaPesos)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white">${formatNumber(totales.mermaDieselPesos)}</td>
                          <td className="px-3 py-3 text-right text-[#111418] dark:text-white bg-gray-200 dark:bg-[#1a2632]">${formatNumber(totales.totalPesos)}</td>
                          <td className={`px-3 py-3 text-right ${promedioEfPremiumPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(promedioEfPremiumPct)}
                          </td>
                          <td className={`px-3 py-3 text-right ${promedioEfMagnaPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(promedioEfMagnaPct)}
                          </td>
                          <td className={`px-3 py-3 text-right ${promedioEfDieselPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(promedioEfDieselPct)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Leyenda de Colores de Precios */}
              {reportes.length > 0 && mostrarPrecios && (
                <div className="mt-4 bg-white dark:bg-[#1a2632] rounded-xl p-6 shadow-sm border border-[#e6e8eb] dark:border-slate-700">
                  <h3 className="text-sm font-bold text-[#111418] dark:text-white mb-4">
                    Leyenda de Precios
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Premium */}
                    <div>
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase mb-2">
                        Premium
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(coloresPrecios.premium)
                          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                          .map(([precio, color]) => (
                            <div
                              key={precio}
                              className="px-3 py-1 rounded text-white font-semibold text-xs"
                              style={{ backgroundColor: color }}
                            >
                              ${formatNumber(parseFloat(precio))}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Magna */}
                    <div>
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase mb-2">
                        Magna
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(coloresPrecios.magna)
                          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                          .map(([precio, color]) => (
                            <div
                              key={precio}
                              className="px-3 py-1 rounded text-white font-semibold text-xs"
                              style={{ backgroundColor: color }}
                            >
                              ${formatNumber(parseFloat(precio))}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Diesel */}
                    <div>
                      <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase mb-2">
                        Diesel
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(coloresPrecios.diesel)
                          .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                          .map(([precio, color]) => (
                            <div
                              key={precio}
                              className="px-3 py-1 rounded text-white font-semibold text-xs"
                              style={{ backgroundColor: color }}
                            >
                              ${formatNumber(parseFloat(precio))}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

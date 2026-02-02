import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas } from '../types/reportes'
import { Role } from '../types/auth'
import GerenteZonaHeader from '../components/GerenteZonaHeader'
import { CierreMensualModal } from '../components/CierreMensualModal'
import VistaHistorial from '../components/views/VistaHistorial'
import VistaDashboard from '../components/views/VistaDashboard'
import ControlFinancieroZona from '../components/ControlFinancieroZona'
import { exportarReporteExcel } from '../utils/exportarExcel'
import { obtenerControlFinanciero } from '../services/cierreMensualService'

type VistaActiva = 'dashboard' | 'revision' | 'historial'

export default function DashboardGerenteZona() {
  const { user } = useAuth()
  const location = useLocation()
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard')
  const [showCierreModal, setShowCierreModal] = useState(false)
  
  // Efecto para manejar el cambio de vista desde la navegación (state)
  useEffect(() => {
    if (location.state?.activeViewId) {
      setVistaActiva(location.state.activeViewId as VistaActiva)
    }
  }, [location.state])
  
  // Filtro de fecha para el dashboard (por defecto, mes actual)
  const [fechaFiltro, setFechaFiltro] = useState<string>(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0] // Formato YYYY-MM-DD (se convertirá a YYYY-MM-01 para el mes)
  })

  // Calcular nombre del mes para el modal de cierre
  const nombreMes = useMemo(() => {
    const fechaSeleccionada = new Date(fechaFiltro + 'T12:00:00')
    return fechaSeleccionada.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  }, [fechaFiltro])

  const [page, setPage] = useState(1)
  const limit = 20

  // Obtener reportes con paginación según la vista activa
  // Para el dashboard, necesitamos obtener todos los reportes (sin paginación)
  // Para revisión e historial, usamos paginación normal
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', vistaActiva, page, fechaFiltro],
    queryFn: () => {
      if (vistaActiva === 'dashboard') {
        // Para dashboard, obtener todos los reportes aprobados sin paginación
        return reportesService.getReportes(1, 1000, 'Aprobado')
      }
      return reportesService.getReportes(page, limit, 'Aprobado')
    },
  })

  const todosReportes = reportesData?.data || []
  const pagination = reportesData?.pagination || { page: 1, limit, total: 0, totalPages: 1 }

  const reportes = useMemo(() => todosReportes, [todosReportes])

  const handleExportarExcel = (reporte: ReporteVentas) => {
    exportarReporteExcel(reporte)
  }

  // Obtener control financiero para el mes seleccionado
  // Usar zona_id directamente del usuario (GerenteZona) o zonas[0] para compatibilidad
  const zonaId = user?.zona_id || user?.zonas?.[0]
  
  const { data: controlFinanciero, isLoading: isLoadingControl } = useQuery({
    queryKey: ['control-financiero', zonaId, fechaFiltro],
    queryFn: () => {
      if (!zonaId) {
        console.warn('[DashboardGerenteZona] No se encontró zona_id para el usuario:', user)
        return null
      }
      const fecha = new Date(fechaFiltro + 'T12:00:00')
      const anio = fecha.getFullYear()
      const mes = fecha.getMonth() + 1
      console.log('[DashboardGerenteZona] Obteniendo control financiero:', { zonaId, anio, mes })
      return obtenerControlFinanciero(zonaId, anio, mes)
    },
    enabled: !!zonaId && vistaActiva === 'dashboard',
  })

  // Datos para gráficas basados en la fecha seleccionada
  // Usar UTC para evitar problemas de zona horaria
  const fechaSeleccionada = new Date(fechaFiltro + 'T12:00:00') // Usar mediodía para evitar problemas de zona horaria
  const mesSeleccionado = fechaSeleccionada.getMonth()
  const añoSeleccionado = fechaSeleccionada.getFullYear()
  
  // Reportes del mes seleccionado (todos los días del mes)
  const reportesAcumulados = useMemo(() => {
    return todosReportes.filter((r) => {
      if (!r.fecha) return false
      // Normalizar la fecha: si viene con hora, extraer solo la fecha
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T00:00:00')
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaReporte.getTime())) return false
      
      // Filtrar solo por mes y año (todos los días del mes)
      return fechaReporte.getMonth() === mesSeleccionado && fechaReporte.getFullYear() === añoSeleccionado
    })
  }, [todosReportes, mesSeleccionado, añoSeleccionado])

  // Calcular el último día del mes que tiene reportes
  const ultimoDiaConReportes = useMemo(() => {
    if (reportesAcumulados.length === 0) return 1
    const dias = reportesAcumulados.map((r) => {
      if (!r.fecha) return 0
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T00:00:00')
      return isNaN(fechaReporte.getTime()) ? 0 : fechaReporte.getDate()
    })
    return Math.max(...dias.filter(d => d > 0), 1)
  }, [reportesAcumulados])
  
  const diaSeleccionado = ultimoDiaConReportes

  // Reportes del último día del mes que tiene reportes
  const reportesDiaSeleccionado = useMemo(() => {
    if (reportesAcumulados.length === 0) return []
    
    // Obtener la fecha del último día con reportes
    const ultimaFecha = reportesAcumulados
      .map((r) => {
        if (!r.fecha) return null
        const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
        return fechaStr
      })
      .filter((f) => f !== null)
      .sort()
      .reverse()[0]
    
    if (!ultimaFecha) return []
    
    return reportesAcumulados.filter((r) => {
      if (!r.fecha) return false
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      return fechaStr === ultimaFecha
    })
  }, [reportesAcumulados])

  // Datos para gráfica de precios por día (solo hasta la fecha seleccionada)
  const datosPreciosPorDia = useMemo(() => {
    const agrupados = reportesAcumulados.reduce((acc, r) => {
      if (!r.fecha) return acc
      const fechaStr = r.fecha.includes('T') ? r.fecha.split('T')[0] : r.fecha
      const fechaReporte = new Date(fechaStr + 'T12:00:00')
      if (isNaN(fechaReporte.getTime())) return acc
      const dia = fechaReporte.getDate()
      if (!acc[dia]) {
        acc[dia] = { dia, premium: 0, magna: 0, diesel: 0, count: 0 }
      }
      acc[dia].premium += r.premium.precio
      acc[dia].magna += r.magna.precio
      acc[dia].diesel += r.diesel.precio
      acc[dia].count += 1
      return acc
    }, {} as Record<number, { dia: number; premium: number; magna: number; diesel: number; count: number }>)

    return Object.values(agrupados)
      .map((item) => ({
        dia: `Día ${item.dia}`,
        Premium: parseFloat((item.premium / item.count).toFixed(2)),
        Magna: parseFloat((item.magna / item.count).toFixed(2)),
        Diesel: parseFloat((item.diesel / item.count).toFixed(2)),
      }))
      .sort((a, b) => parseInt(a.dia.split(' ')[1]) - parseInt(b.dia.split(' ')[1]))
  }, [reportesAcumulados])

  // Datos para gráfica de litros por ZONA (agrupado) - acumulado
  const datosLitrosPorZona = useMemo(() => {
    const agrupados = reportesAcumulados.reduce((acc, r) => {
      const zonaNombre = r.zonaNombre || 'Sin Zona'
      if (!acc[zonaNombre]) {
        acc[zonaNombre] = { zona: zonaNombre, premium: 0, magna: 0, diesel: 0 }
      }
      acc[zonaNombre].premium += r.premium.importe
      acc[zonaNombre].magna += r.magna.importe
      acc[zonaNombre].diesel += r.diesel.importe
      return acc
    }, {} as Record<string, { zona: string; premium: number; magna: number; diesel: number }>)

    return Object.values(agrupados).map((item) => ({
      zona: item.zona,
      Premium: parseFloat(item.premium.toFixed(2)),
      Magna: parseFloat(item.magna.toFixed(2)),
      Diesel: parseFloat(item.diesel.toFixed(2)),
    }))
  }, [reportesAcumulados])

  // Datos para gráfica de merma por ESTACIÓN (de la zona del gerente) - filtrado por mes
  // IMPORTANTE: Mostrar E% (merma_porcentaje) - la pérdida por evaporación/fuga
  const datosMermaPorEstacion = useMemo(() => {
    const mesSeleccionado = fechaSeleccionada.getMonth()
    const anoSeleccionado = fechaSeleccionada.getFullYear()

    // Filtrar por mes seleccionado
    const reportesFiltrados = reportesAcumulados.filter((r) => {
      const reporteFecha = new Date(r.fecha)
      return (
        reporteFecha.getMonth() === mesSeleccionado &&
        reporteFecha.getFullYear() === anoSeleccionado
      )
    })

    // Agrupar por estación y calcular promedio de E% (merma_porcentaje)
    const agrupados = reportesFiltrados.reduce((acc, r) => {
      const estacionNombre = r.estacionNombre || 'Sin Estación'
      if (!acc[estacionNombre]) {
        acc[estacionNombre] = {
          estacion: estacionNombre,
          premiumTotal: 0,
          premiumCount: 0,
          magnaTotal: 0,
          magnaCount: 0,
          dieselTotal: 0,
          dieselCount: 0,
        }
      }
      // Acumular E% (merma_porcentaje) - siempre incluir, incluso si es 0
      if (r.premium?.mermaPorcentaje !== undefined) {
        acc[estacionNombre].premiumTotal += r.premium.mermaPorcentaje
        acc[estacionNombre].premiumCount++
      }
      if (r.magna?.mermaPorcentaje !== undefined) {
        acc[estacionNombre].magnaTotal += r.magna.mermaPorcentaje
        acc[estacionNombre].magnaCount++
      }
      if (r.diesel?.mermaPorcentaje !== undefined) {
        acc[estacionNombre].dieselTotal += r.diesel.mermaPorcentaje
        acc[estacionNombre].dieselCount++
      }
      return acc
    }, {} as Record<string, { estacion: string; premiumTotal: number; premiumCount: number; magnaTotal: number; magnaCount: number; dieselTotal: number; dieselCount: number }>)

    // Calcular promedios y ordenar por merma total (mayor a menor)
    return Object.values(agrupados)
      .map((item) => ({
        estacion: item.estacion,
        Premium: item.premiumCount > 0 ? parseFloat((item.premiumTotal / item.premiumCount).toFixed(2)) : 0,
        Magna: item.magnaCount > 0 ? parseFloat((item.magnaTotal / item.magnaCount).toFixed(2)) : 0,
        Diesel: item.dieselCount > 0 ? parseFloat((item.dieselTotal / item.dieselCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => (b.Premium + b.Magna + b.Diesel) - (a.Premium + a.Magna + a.Diesel))
  }, [reportesAcumulados, fechaSeleccionada])

  // Datos para gráfica de TOP 10 estaciones (solo las mejores) - acumulado
  const datosTopEstaciones = useMemo(() => {
    const agrupados = reportesAcumulados.reduce((acc, r) => {
      if (!acc[r.estacionNombre]) {
        acc[r.estacionNombre] = {
          estacion: r.estacionNombre,
          zona: r.zonaNombre || 'Sin Zona',
          total: 0,
        }
      }
      acc[r.estacionNombre].total += r.premium.importe + r.magna.importe + r.diesel.importe + (r.aceites || 0)
      return acc
    }, {} as Record<string, { estacion: string; zona: string; total: number }>)

    return Object.values(agrupados)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10 estaciones
      .map((item) => ({
        estacion: item.estacion,
        zona: item.zona,
        'Total Ventas': parseFloat(item.total.toFixed(2)),
      }))
  }, [reportesAcumulados])

  // Totales acumulados desde el día 1 hasta la fecha seleccionada (usando importe)
  const totalesAcumulados = useMemo(() => {
    return reportesAcumulados.reduce(
      (acc, r) => {
        acc.premium += r.premium.importe
        acc.magna += r.magna.importe
        acc.diesel += r.diesel.importe
        acc.aceites += r.aceites || 0
        return acc
      },
      { premium: 0, magna: 0, diesel: 0, aceites: 0 }
    )
  }, [reportesAcumulados])

  // Totales del día seleccionado
  const totalesDia = useMemo(() => {
    return reportesDiaSeleccionado.reduce(
      (acc, r) => {
        acc.premium += r.premium.importe
        acc.magna += r.magna.importe
        acc.diesel += r.diesel.importe
        acc.aceites += r.aceites || 0
        return acc
      },
      { premium: 0, magna: 0, diesel: 0, aceites: 0 }
    )
  }, [reportesDiaSeleccionado])

  const totalGeneralAcumulado = totalesAcumulados.premium + totalesAcumulados.magna + totalesAcumulados.diesel + totalesAcumulados.aceites
  const totalGeneralDia = totalesDia.premium + totalesDia.magna + totalesDia.diesel + totalesDia.aceites

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <GerenteZonaHeader vistaActiva={vistaActiva} onChangeVista={setVistaActiva} />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {vistaActiva === 'dashboard' && (
          <>
            <VistaDashboard
              totalesAcumulados={totalesAcumulados}
              totalesDia={totalesDia}
              totalGeneralAcumulado={totalGeneralAcumulado}
              totalGeneralDia={totalGeneralDia}
              datosPreciosPorDia={datosPreciosPorDia}
              datosLitrosPorZona={datosLitrosPorZona}
              datosMermaPorEstacion={datosMermaPorEstacion}
              datosTopEstaciones={datosTopEstaciones}
              fechaFiltro={fechaFiltro}
              setFechaFiltro={setFechaFiltro}
              reportesAcumulados={reportesAcumulados}
              reportesDiaSeleccionado={reportesDiaSeleccionado}
              onOpenCierre={() => setShowCierreModal(true)}
            />
            
            {/* Control Financiero */}
            <div className="mt-8">
              <ControlFinancieroZona
                controlFinanciero={controlFinanciero || null}
                isLoading={isLoadingControl}
                zonaNombre={user?.name || 'Zona'}
                mesNombre={nombreMes}
              />
            </div>
          </>
        )}

        {vistaActiva === 'revision' && (
          <VistaHistorial
            userRole={user?.role || Role.GerenteZona}
            titulo="Reportes de Zona"
            descripcion="Reportes aprobados por el gerente de estación"
            estadoFiltro="Aprobado"
            onExportarExcel={handleExportarExcel}
          />
        )}

        {vistaActiva === 'historial' && (
          <VistaHistorial
            userRole={user?.role || Role.GerenteZona}
            estadoFiltro="Aprobado"
            onExportarExcel={handleExportarExcel}
          />
        )}
      </main>

      {/* Modal de Cierre Mensual */}
      {showCierreModal && zonaId && (
        <CierreMensualModal
          isOpen={showCierreModal}
          onClose={() => setShowCierreModal(false)}
          zonaId={zonaId}
          zonaNombre={user?.name || 'Zona'}
          anio={parseInt(fechaFiltro.split('-')[0])}
          mes={parseInt(fechaFiltro.split('-')[1])}
          mesNombre={nombreMes}
        />
      )}
        </div>
  )
}

// VistaDashboard ahora está en src/components/views/VistaDashboard.tsx

// Componente Modal de Revisión
function ModalRevision({
  selectedReporte,
  comentarios,
  setComentarios,
  updateEstadoMutation,
  onClose,
  handleAprobar,
  handleRechazar,
  calcularTotalVentas,
}: {
  selectedReporte: ReporteVentas
  comentarios: string
  setComentarios: (value: string) => void
  updateEstadoMutation: any
  onClose: () => void
  handleAprobar: () => void
  handleRechazar: () => void
  calcularTotalVentas: (reporte: ReporteVentas) => number
}) {
  const obtenerMetricasEficiencia = (producto: any) => {
    const litros = producto?.litros || 0
    const mermaVolumen = producto?.mermaVolumen || 0
    const volumenNeto = litros - mermaVolumen
    const eficienciaReal =
      typeof producto?.eficienciaReal === 'number'
        ? producto.eficienciaReal
        : (producto?.iffb || 0) - (producto?.if || 0)
    const eficienciaImporte =
      typeof producto?.eficienciaImporte === 'number'
        ? producto.eficienciaImporte
        : eficienciaReal * (producto?.precio || 0)
    const eficienciaRealPorcentaje =
      typeof producto?.eficienciaRealPorcentaje === 'number'
        ? producto.eficienciaRealPorcentaje
        : litros > 0
        ? (eficienciaReal / litros) * 100
        : 0
    const diferencia = eficienciaReal - mermaVolumen
    const diferenciaPorcentaje = volumenNeto > 0 ? (diferencia / volumenNeto) * 100 : 0

    return {
      eficienciaReal,
      eficienciaImporte,
      eficienciaRealPorcentaje,
      diferencia,
      diferenciaPorcentaje,
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#e6e8eb] dark:border-slate-700">
        <div className="sticky top-0 bg-white dark:bg-[#1a2632] border-b border-[#e6e8eb] dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-[#111418] dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">description</span>
                Revisar Reporte - {selectedReporte.estacionNombre}
              </h3>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#617589] dark:text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
              <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Fecha</p>
              <p className="text-base font-bold text-[#111418] dark:text-white">
                {new Date(selectedReporte.fecha).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#101922]">
              <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-1">Creado Por</p>
              <p className="text-base font-bold text-[#111418] dark:text-white">{selectedReporte.creadoPor}</p>
            </div>
          </div>

          {/* Detalles de Combustibles */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#111418] dark:text-white uppercase tracking-wider">
              Detalles de Ventas
            </h4>

            {/* Premium */}
            <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-red-50/30 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400">local_gas_station</span>
                <h5 className="font-bold text-[#111418] dark:text-white">Premium</h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Precio por Litro</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    ${selectedReporte.premium.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </p>
                </div>
                  <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Litros Vendidos</p>
                  <p className="text-lg font-bold text-[#111418] dark:text-white">
                    {selectedReporte.premium.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Total</p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">
                    ${selectedReporte.premium.importe.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    </p>
                  </div>
                  {(selectedReporte.premium.mermaVolumen > 0 || selectedReporte.premium.mermaImporte > 0) && (
                    <div className="col-span-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">Merma</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {selectedReporte.premium.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            ${selectedReporte.premium.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {selectedReporte.premium.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const {
                      eficienciaReal,
                      eficienciaImporte,
                      eficienciaRealPorcentaje,
                      diferencia,
                      diferenciaPorcentaje,
                    } = obtenerMetricasEficiencia(selectedReporte.premium)
                    return (
                      <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Eficiencia Real</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Volumen (IFFB - IF)</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {eficienciaReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Importe</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              ${eficienciaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {eficienciaRealPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">+</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">%</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {diferenciaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">CCT</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">DC</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.premium.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

            {/* Magna */}
            <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-green-50/30 dark:bg-green-900/10">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400">local_gas_station</span>
                <h5 className="font-bold text-[#111418] dark:text-white">Magna</h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Precio por Litro</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${selectedReporte.magna.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </p>
                  </div>
                  <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Litros Vendidos</p>
                  <p className="text-lg font-bold text-[#111418] dark:text-white">
                    {selectedReporte.magna.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-green-200 dark:border-green-800">
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Total</p>
                  <p className="text-xl font-black text-green-600 dark:text-green-400">
                    ${selectedReporte.magna.importe.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                  {(selectedReporte.magna.mermaVolumen > 0 || selectedReporte.magna.mermaImporte > 0) && (
                    <div className="col-span-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">Merma</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {selectedReporte.magna.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            ${selectedReporte.magna.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {selectedReporte.magna.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const {
                      eficienciaReal,
                      eficienciaImporte,
                      eficienciaRealPorcentaje,
                      diferencia,
                      diferenciaPorcentaje,
                    } = obtenerMetricasEficiencia(selectedReporte.magna)
                    return (
                      <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Eficiencia Real</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Volumen (IFFB - IF)</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {eficienciaReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Importe</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              ${eficienciaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {eficienciaRealPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">+</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#617589] dark:text-slate-400">%</p>
                            <p className="font-semibold text-[#111418] dark:text-white">
                              {diferenciaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">CCT</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">DC</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                        <p className="font-semibold text-[#111418] dark:text-white">
                          {(selectedReporte.magna.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>

            {/* Diesel */}
            <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50/30 dark:bg-gray-900/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">local_gas_station</span>
                <h5 className="font-bold text-[#111418] dark:text-white">Diesel</h5>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Precio por Litro</p>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    ${selectedReporte.diesel.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Litros Vendidos</p>
                  <p className="text-lg font-bold text-[#111418] dark:text-white">
                    {selectedReporte.diesel.litros.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Total</p>
                  <p className="text-xl font-black text-gray-700 dark:text-gray-300">
                    ${selectedReporte.diesel.importe.toLocaleString('es-MX', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                {(selectedReporte.diesel.mermaVolumen > 0 || selectedReporte.diesel.mermaImporte > 0) && (
                  <div className="col-span-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">Merma</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Volumen</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          {selectedReporte.diesel.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Importe</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          ${selectedReporte.diesel.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          {selectedReporte.diesel.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {(() => {
                  const {
                    eficienciaReal,
                    eficienciaImporte,
                    eficienciaRealPorcentaje,
                    diferencia,
                    diferenciaPorcentaje,
                  } = obtenerMetricasEficiencia(selectedReporte.diesel)
                  return (
                    <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">Eficiencia Real</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Volumen (IFFB - IF)</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {eficienciaReal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Importe</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            ${eficienciaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">Porcentaje</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {eficienciaRealPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">+</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#617589] dark:text-slate-400">%</p>
                          <p className="font-semibold text-[#111418] dark:text-white">
                            {diferenciaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-semibold text-[#617589] dark:text-slate-400 mb-2">Inventario y Compras</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.I.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Compras (C)</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">CCT</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">DC</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">Dif V. Dsc</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#617589] dark:text-slate-400">I.F.F.B.</p>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {(selectedReporte.diesel.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aceites */}
            {selectedReporte.aceites !== undefined && selectedReporte.aceites > 0 && (
              <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-purple-50/30 dark:bg-purple-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">oil_barrel</span>
                  <h5 className="font-bold text-[#111418] dark:text-white">Aceites</h5>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe</p>
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                      ${selectedReporte.aceites.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Total General */}
            <div className="rounded-lg border-2 border-[#1173d4] dark:border-[#1173d4] p-4 bg-[#1173d4]/5 dark:bg-[#1173d4]/10">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#111418] dark:text-white">Total General de Ventas</p>
                <p className="text-2xl font-black text-[#1173d4]">
                  ${calcularTotalVentas(selectedReporte).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-gray-200 mb-2">
                    Comentarios (opcional)
                  </label>
                  <textarea
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white p-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent transition-shadow resize-none"
                    placeholder="Agrega comentarios sobre la revisión..."
                  />
              </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
                <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
              onClick={handleRechazar}
              disabled={updateEstadoMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateEstadoMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">cancel</span>
                  <span>Rechazar</span>
                </>
              )}
                </button>
                <button
              onClick={handleAprobar}
              disabled={updateEstadoMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateEstadoMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>Aprobar</span>
                </>
              )}
                </button>
              </div>
            </div>
          </div>
    </div>
  )
}

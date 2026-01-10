import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte } from '../types/reportes'
import { Role } from '../types/auth'
import GerenteZonaHeader from '../components/GerenteZonaHeader'
import DetalleReporteModal from '../components/DetalleReporteModal'
import VistaHistorial from '../components/views/VistaHistorial'
import VistaRevision from '../components/views/VistaRevision'
import VistaDashboard from '../components/views/VistaDashboard'
import { exportarReporteExcel } from '../utils/exportarExcel'

type VistaActiva = 'dashboard' | 'revision' | 'historial'

export default function DashboardGerenteZona() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('dashboard')
  const [selectedReporte, setSelectedReporte] = useState<ReporteVentas | null>(null)
  const [comentarios, setComentarios] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [reporteDetalle, setReporteDetalle] = useState<ReporteVentas | null>(null)
  
  // Filtro de fecha para el dashboard (por defecto, mes actual)
  const [fechaFiltro, setFechaFiltro] = useState<string>(() => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0] // Formato YYYY-MM-DD (se convertirá a YYYY-MM-01 para el mes)
  })

  const [page, setPage] = useState(1)
  const limit = 20

  // Obtener reportes con paginación según la vista activa
  const estadoFiltro = vistaActiva === 'revision' ? 'EnRevision' : vistaActiva === 'historial' ? 'Aprobado,Rechazado' : undefined
  
  // Para el dashboard, necesitamos obtener todos los reportes aprobados (sin paginación)
  // Para revision e historial, usamos paginación normal
  const { data: reportesData, isLoading } = useQuery({
    queryKey: ['reportes', vistaActiva, page, fechaFiltro],
    queryFn: () => {
      if (vistaActiva === 'dashboard') {
        // Para dashboard, obtener todos los reportes aprobados sin paginación
        return reportesService.getReportes(1, 1000, 'Aprobado')
      }
      return reportesService.getReportes(page, limit, estadoFiltro)
    },
  })

  const todosReportes = reportesData?.data || []
  const pagination = reportesData?.pagination || { page: 1, limit, total: 0, totalPages: 1 }

  // Filtrar reportes según la vista (ya viene filtrado del backend, pero por seguridad)
  const reportes = useMemo(() => {
    if (vistaActiva === 'revision') {
      return todosReportes.filter((r) => r.estado === EstadoReporte.EnRevision)
    } else if (vistaActiva === 'historial') {
      return todosReportes.filter(
        (r) => r.estado === EstadoReporte.Aprobado || r.estado === EstadoReporte.Rechazado
      )
    }
    return todosReportes
  }, [todosReportes, vistaActiva])

  // Mutation para actualizar estado
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado, comentarios }: { id: string; estado: EstadoReporte; comentarios?: string }) =>
      reportesService.updateEstado(id, { estado, comentarios }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] })
      setShowModal(false)
      setSelectedReporte(null)
      setComentarios('')
      setPage(1) // Resetear a página 1 después de actualizar
    },
  })

  const handleExportarExcel = (reporte: ReporteVentas) => {
    exportarReporteExcel(reporte)
  }

  // Estadísticas para revisión
  // Nota: El backend filtra reportes EnRevision, Aprobado y Rechazado para GerenteZona
  const totalEnRevision = vistaActiva === 'revision' ? pagination.total : reportes.filter((r) => r.estado === EstadoReporte.EnRevision).length
  const totalReportes = vistaActiva === 'revision' ? pagination.total : reportes.length


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

  // Datos para gráfica de ventas totales por ZONA (agrupado) - acumulado
  const datosVentasPorZona = useMemo(() => {
    const agrupados = reportesAcumulados.reduce((acc, r) => {
      const zonaNombre = r.zonaNombre || 'Sin Zona'
      if (!acc[zonaNombre]) {
        acc[zonaNombre] = 0
      }
      acc[zonaNombre] += r.premium.importe + r.magna.importe + r.diesel.importe + (r.aceites || 0)
      return acc
    }, {} as Record<string, number>)

    return Object.entries(agrupados)
      .map(([zona, total]) => ({
        zona,
        'Total Ventas': parseFloat(total.toFixed(2)),
      }))
      .sort((a, b) => b['Total Ventas'] - a['Total Ventas'])
  }, [reportesAcumulados])

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

  const handleVerDetalle = (reporte: ReporteVentas) => {
    setSelectedReporte(reporte)
    setComentarios(reporte.comentarios || '')
    setShowModal(true)
  }

  const handleAprobar = () => {
    if (selectedReporte) {
      updateEstadoMutation.mutate({
        id: selectedReporte.id,
        estado: EstadoReporte.Aprobado,
        comentarios: comentarios || undefined,
      })
    }
  }

  const handleRechazar = () => {
    if (selectedReporte) {
      updateEstadoMutation.mutate({
        id: selectedReporte.id,
        estado: EstadoReporte.Rechazado,
        comentarios: comentarios || undefined,
      })
    }
  }

  const getEstadoBadge = (estado: EstadoReporte) => {
    switch (estado) {
      case EstadoReporte.Pendiente:
        return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case EstadoReporte.EnRevision:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
      case EstadoReporte.Aprobado:
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case EstadoReporte.Rechazado:
        return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  const getEstadoIcon = (estado: EstadoReporte) => {
    switch (estado) {
      case EstadoReporte.Pendiente:
        return 'schedule'
      case EstadoReporte.EnRevision:
        return 'hourglass_empty'
      case EstadoReporte.Aprobado:
        return 'check_circle'
      case EstadoReporte.Rechazado:
        return 'cancel'
      default:
        return 'help'
    }
  }

  const calcularTotalVentas = (reporte: ReporteVentas) => {
    return reporte.premium.importe + reporte.magna.importe + reporte.diesel.importe + (reporte.aceites || 0)
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <GerenteZonaHeader vistaActiva={vistaActiva} onChangeVista={setVistaActiva} />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {vistaActiva === 'dashboard' && (
        <VistaDashboard
            totalesAcumulados={totalesAcumulados}
            totalesDia={totalesDia}
            totalGeneralAcumulado={totalGeneralAcumulado}
            totalGeneralDia={totalGeneralDia}
          datosPreciosPorDia={datosPreciosPorDia}
          datosLitrosPorZona={datosLitrosPorZona}
          datosVentasPorZona={datosVentasPorZona}
          datosTopEstaciones={datosTopEstaciones}
            fechaFiltro={fechaFiltro}
            setFechaFiltro={setFechaFiltro}
            reportesAcumulados={reportesAcumulados}
            reportesDiaSeleccionado={reportesDiaSeleccionado}
        />
        )}

        {vistaActiva === 'revision' && (
          <VistaRevision
            reportes={reportes}
            isLoading={isLoading}
            totalEnRevision={totalEnRevision}
            totalReportes={totalReportes}
            getEstadoBadge={getEstadoBadge}
            getEstadoIcon={getEstadoIcon}
            calcularTotalVentas={calcularTotalVentas}
            handleVerDetalle={handleVerDetalle}
            onExportarExcel={handleExportarExcel}
            pagination={pagination}
            onPageChange={setPage}
          />
        )}

        {vistaActiva === 'historial' && (
          <VistaHistorial userRole={user?.role || Role.GerenteZona} onExportarExcel={handleExportarExcel} />
        )}
      </main>

      {/* Modal de Revisión */}
      {showModal && selectedReporte && (
        <ModalRevision
          selectedReporte={selectedReporte}
          comentarios={comentarios}
          setComentarios={setComentarios}
          updateEstadoMutation={updateEstadoMutation}
          onClose={() => {
            setShowModal(false)
            setSelectedReporte(null)
            setComentarios('')
          }}
          handleAprobar={handleAprobar}
          handleRechazar={handleRechazar}
          calcularTotalVentas={calcularTotalVentas}
        />
      )}

      {/* Modal de Detalle (para historial) */}
      {showDetalleModal && reporteDetalle && (
        <DetalleReporteModal
          reporte={reporteDetalle}
          onClose={() => {
            setShowDetalleModal(false)
            setReporteDetalle(null)
          }}
          titulo={`Detalle del Reporte - ${reporteDetalle.estacionNombre}`}
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

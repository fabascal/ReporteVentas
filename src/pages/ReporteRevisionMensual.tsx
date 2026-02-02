import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte, ProductoCatalogo } from '../types/reportes'
import { Role } from '../types/auth'
import GerenteEstacionHeader from '../components/GerenteEstacionHeader'
import GerenteZonaHeader from '../components/GerenteZonaHeader'
import toast from 'react-hot-toast'

interface DiaReporte {
  dia: number
  fecha: string
  reporte?: ReporteVentas
  productos?: ProductoCatalogo[]
}

// Tipos para edición
interface CamposEditables {
  [reporteId: string]: {
    aceites?: number
    productos: {
      [tipoProducto: string]: {
        iib?: number
        compras?: number
        cct?: number
        v_dsc?: number
        iffb?: number
      }
    }
  }
}

export default function ReporteRevisionMensual() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [estacionId, setEstacionId] = useState('')
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [año, setAño] = useState(String(new Date().getFullYear()))
  const [hasConsulted, setHasConsulted] = useState(false)
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({})
  const [editValues, setEditValues] = useState<CamposEditables>({})
  const [productosConfig, setProductosConfig] = useState<ProductoCatalogo[]>([])

  // Obtener estaciones del usuario
  const { data: estaciones = [] } = useQuery({
    queryKey: ['estaciones', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await reportesService.getEstaciones()
      return response
    },
    enabled: !!user?.id
  })

  // Obtener catálogo de productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const productos = await reportesService.getProductosCatalogo()
        setProductosConfig(productos)
      } catch (error) {
        console.error('Error al cargar productos:', error)
      }
    }
    fetchProductos()
  }, [])

  // Obtener reportes del mes
  const { data: reportes = [], isLoading, refetch } = useQuery({
    queryKey: ['reportes-mes', estacionId, mes, año],
    queryFn: async () => {
      if (!estacionId || !mes || !año) return []
      
      const mesInt = parseInt(mes)
      const añoInt = parseInt(año)
      const primerDia = new Date(añoInt, mesInt - 1, 1)
      const ultimoDia = new Date(añoInt, mesInt, 0)
      
      const fechaInicio = primerDia.toISOString().split('T')[0]
      const fechaFin = ultimoDia.toISOString().split('T')[0]
      
      const response = await reportesService.getReportes(
        1, // page
        100, // limit
        undefined, // estado
        undefined, // busqueda
        estacionId, // estacionId
        fechaInicio, // fechaDesde
        fechaFin // fechaHasta
      )
      
      return response.data || []
    },
    enabled: false
  })

  // Generar días del mes
  const generarDiasDelMes = (): DiaReporte[] => {
    if (!mes || !año) return []
    
    const mesInt = parseInt(mes)
    const añoInt = parseInt(año)
    const diasEnMes = new Date(añoInt, mesInt, 0).getDate()
    const dias: DiaReporte[] = []
    
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(añoInt, mesInt - 1, dia)
      const fechaStr = fecha.toISOString().split('T')[0]
      
      const reporte = reportes.find(r => {
        const reporteFecha = new Date(r.fecha).toISOString().split('T')[0]
        return reporteFecha === fechaStr
      })
      
      dias.push({
        dia,
        fecha: fechaStr,
        reporte,
        productos: productosConfig
      })
    }
    
    return dias
  }

  const dias = generarDiasDelMes()

  // Mutación para actualizar estado
  const updateEstadoMutation = useMutation({
    mutationFn: async ({ reporteId, nuevoEstado }: { reporteId: string; nuevoEstado: EstadoReporte }) => {
      return await reportesService.updateEstado(reporteId, nuevoEstado)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      toast.success('Estado actualizado correctamente')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar estado')
    }
  })

  // Mutación para actualizar reporte
  const updateReporteMutation = useMutation({
    mutationFn: async ({ reporteId, data }: { reporteId: string; data: any }) => {
      return await reportesService.updateReporte(reporteId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      toast.success('Reporte actualizado correctamente')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar reporte')
    }
  })

  // Mutación para crear reporte manual
  const createReporteMutation = useMutation({
    mutationFn: async (data: any) => {
      return await reportesService.createReporte(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      toast.success('Reporte creado correctamente')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear reporte')
    }
  })

  const handleConsultar = () => {
    setHasConsulted(true)
    refetch()
  }

  const toggleRow = (diaKey: string, dia: number, reporte: ReporteVentas | undefined, dias: DiaReporte[]) => {
    const isExpanding = !expandedRows[diaKey]
    setExpandedRows(prev => ({ ...prev, [diaKey]: isExpanding }))
    
    // Inicializar valores editables al expandir
    if (isExpanding && reporte) {
      inicializarValoresEditables(dia, reporte, dias)
    }
  }

  const getProductoNombre = (productoId: string): string => {
    const producto = productosConfig.find(p => p.id === productoId)
    return producto?.nombre_display || 'Producto'
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case EstadoReporte.Aprobado:
        return 'text-green-600'
      case EstadoReporte.Pendiente:
        return 'text-yellow-600'
      case EstadoReporte.Rechazado:
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case EstadoReporte.Aprobado:
        return 'check_circle'
      case EstadoReporte.Pendiente:
        return 'pending'
      case EstadoReporte.Rechazado:
        return 'cancel'
      default:
        return 'help'
    }
  }

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00'
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }

  const formatInputNumber = (value: string): string => {
    const num = parseFloat(value.replace(/,/g, ''))
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
  }

  const parseInputNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  // Obtener el I.I.B. para un día específico (día 1: manual, días posteriores: I.F.F.B. del día anterior)
  const getIIB = (dia: number, reporteActual: ReporteVentas | undefined, dias: DiaReporte[], tipoProducto: 'premium' | 'magna' | 'diesel'): number => {
    if (dia === 1) {
      // Día 1: usar el valor actual o 0
      return reporteActual?.[tipoProducto]?.inventario_inicial || 0
    } else {
      // Días posteriores: usar I.F.F.B. del día anterior
      const diaAnterior = dias.find(d => d.dia === dia - 1)
      return diaAnterior?.reporte?.[tipoProducto]?.inventario_final || 0
    }
  }

  // Inicializar valores editables cuando se expande una fila
  const inicializarValoresEditables = (dia: number, reporte: ReporteVentas, dias: DiaReporte[]) => {
    if (!editValues[reporte.id]) {
      setEditValues(prev => ({
        ...prev,
        [reporte.id]: {
          aceites: reporte.aceites || 0,
          productos: {
            premium: {
              iib: getIIB(dia, reporte, dias, 'premium'),
              compras: reporte.premium?.compras || 0,
              cct: reporte.premium?.cct || 0,
              v_dsc: reporte.premium?.v_dsc || 0,
              iffb: reporte.premium?.inventario_final || 0,
            },
            magna: {
              iib: getIIB(dia, reporte, dias, 'magna'),
              compras: reporte.magna?.compras || 0,
              cct: reporte.magna?.cct || 0,
              v_dsc: reporte.magna?.v_dsc || 0,
              iffb: reporte.magna?.inventario_final || 0,
            },
            diesel: {
              iib: getIIB(dia, reporte, dias, 'diesel'),
              compras: reporte.diesel?.compras || 0,
              cct: reporte.diesel?.cct || 0,
              v_dsc: reporte.diesel?.v_dsc || 0,
              iffb: reporte.diesel?.inventario_final || 0,
            },
          }
        }
      }))
    }
  }

  const handleFieldChange = (reporteId: string, tipoProducto: string, campo: string, valor: string) => {
    const numValue = parseInputNumber(valor)
    setEditValues(prev => ({
      ...prev,
      [reporteId]: {
        ...prev[reporteId],
        aceites: prev[reporteId]?.aceites || 0,
        productos: {
          ...prev[reporteId]?.productos,
          [tipoProducto]: {
            ...prev[reporteId]?.productos?.[tipoProducto],
            [campo]: numValue
          }
        }
      }
    }))
  }

  const handleAceitesChange = (reporteId: string, valor: string) => {
    const numValue = parseInputNumber(valor)
    setEditValues(prev => ({
      ...prev,
      [reporteId]: {
        ...prev[reporteId],
        aceites: numValue,
        productos: prev[reporteId]?.productos || {}
      }
    }))
  }

  const handleGuardarCambios = async (reporteId: string) => {
    const valores = editValues[reporteId]
    if (!valores) return

    try {
      await updateReporteMutation.mutateAsync({
        reporteId,
        data: {
          aceites: valores.aceites,
          productos: {
            premium: {
              iib: valores.productos.premium?.iib,
              compras: valores.productos.premium?.compras,
              cct: valores.productos.premium?.cct,
              vDsc: valores.productos.premium?.v_dsc,
              iffb: valores.productos.premium?.iffb,
            },
            magna: {
              iib: valores.productos.magna?.iib,
              compras: valores.productos.magna?.compras,
              cct: valores.productos.magna?.cct,
              vDsc: valores.productos.magna?.v_dsc,
              iffb: valores.productos.magna?.iffb,
            },
            diesel: {
              iib: valores.productos.diesel?.iib,
              compras: valores.productos.diesel?.compras,
              cct: valores.productos.diesel?.cct,
              vDsc: valores.productos.diesel?.v_dsc,
              iffb: valores.productos.diesel?.iffb,
            },
          }
        }
      })
      toast.success('Cambios guardados correctamente')
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast.error('Error al guardar cambios')
    }
  }

  const handleAprobar = (reporteId: string) => {
    updateEstadoMutation.mutate({ reporteId, nuevoEstado: EstadoReporte.Aprobado })
  }

  const handleRechazar = (reporteId: string) => {
    updateEstadoMutation.mutate({ reporteId, nuevoEstado: EstadoReporte.Rechazado })
  }

  const handleCrearReporte = async (fecha: string) => {
    if (!estacionId) return
    
    toast.loading('Creando reporte...')
    createReporteMutation.mutate({
      estacion_id: estacionId,
      fecha: fecha,
      aceites: 0
    })
  }

  // Renderizar campo editable o de solo lectura
  const renderField = (
    reporteId: string,
    tipoProducto: string,
    campo: string,
    valorActual: number | undefined,
    editable: boolean,
    dia: number
  ) => {
    // Si el campo es IIB y no es día 1, no es editable
    const esEditable = editable && !(campo === 'iib' && dia !== 1)
    const valor = editValues[reporteId]?.productos?.[tipoProducto]?.[campo] ?? valorActual ?? 0

    if (esEditable) {
      return (
        <input
          type="text"
          value={formatNumber(valor)}
          onChange={(e) => handleFieldChange(reporteId, tipoProducto, campo, e.target.value)}
          className="w-20 px-1 py-0.5 text-right text-xs border border-[#dbe0e6] dark:border-slate-600 rounded bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1173d4]"
        />
      )
    }

    return <span>{formatNumber(valor)}</span>
  }

  const renderHeader = () => {
    if (user?.role === Role.GerenteZona) {
      return <GerenteZonaHeader />
    }
    return <GerenteEstacionHeader />
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
      {renderHeader()}
      
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#111418] dark:text-white mb-2">
            Revisión Mensual
          </h1>
          <p className="text-[#617589] dark:text-slate-400">
            Consulta y aprueba los reportes diarios de tu estación
          </p>
        </div>

        {/* Parámetros de búsqueda */}
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">
            PARÁMETROS DE BÚSQUEDA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                Estación *
              </label>
              <select
                value={estacionId}
                onChange={(e) => {
                  setEstacionId(e.target.value)
                  setHasConsulted(false)
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
              >
                <option value="">Seleccione...</option>
                {estaciones.map((est: any) => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                Mes *
              </label>
              <select
                value={mes}
                onChange={(e) => {
                  setMes(e.target.value)
                  setHasConsulted(false)
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
              >
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
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
                Año *
              </label>
              <select
                value={año}
                onChange={(e) => {
                  setAño(e.target.value)
                  setHasConsulted(false)
                }}
                className="w-full px-4 py-2 rounded-lg border border-[#e6e8eb] dark:border-slate-700 bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4]"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleConsultar}
                disabled={!estacionId || !mes || !año}
                className="w-full px-6 py-2 bg-[#1173d4] text-white font-bold rounded-lg hover:bg-[#1173d4]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Consultar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de reportes */}
        {hasConsulted && (
          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#0f1419] border-b border-[#e6e8eb] dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      1 LTS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      ER%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      2 LTS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      ER%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      3 LTS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      ER%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Aceites
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1173d4]"></div>
                          <span className="ml-3 text-[#617589]">Cargando reportes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : dias.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center text-[#617589] dark:text-slate-400">
                        No hay datos para mostrar
                      </td>
                    </tr>
                  ) : (
                    dias.map((dia) => (
                      <React.Fragment key={`dia-${dia.dia}`}>
                        {/* Fila principal (colapsada) */}
                        <tr className="hover:bg-gray-50 dark:hover:bg-[#0d1b2a] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => dia.reporte && toggleRow(`dia-${dia.dia}`, dia.dia, dia.reporte, dias)}
                                disabled={!dia.reporte}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-30"
                              >
                                <span className="material-symbols-outlined text-lg">
                                  {expandedRows[`dia-${dia.dia}`] ? 'expand_less' : 'chevron_right'}
                                </span>
                              </button>
                              {dia.reporte && (
                                <span className={`material-symbols-outlined ${getEstadoColor(dia.reporte.estado)}`}>
                                  {getEstadoIcon(dia.reporte.estado)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#111418] dark:text-white">
                            {dia.dia} {new Date(parseInt(año), parseInt(mes) - 1, dia.dia).toLocaleDateString('es-MX', { month: 'short' })}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.premium?.litros_vendidos ? formatNumber(dia.reporte.premium.litros_vendidos) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.premium?.eficiencia_real_porcentaje ? formatNumber(dia.reporte.premium.eficiencia_real_porcentaje) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.magna?.litros_vendidos ? formatNumber(dia.reporte.magna.litros_vendidos) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.magna?.eficiencia_real_porcentaje ? formatNumber(dia.reporte.magna.eficiencia_real_porcentaje) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.diesel?.litros_vendidos ? formatNumber(dia.reporte.diesel.litros_vendidos) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.diesel?.eficiencia_real_porcentaje ? formatNumber(dia.reporte.diesel.eficiencia_real_porcentaje) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte ? (
                              dia.reporte.estado === EstadoReporte.Pendiente ? (
                                <input
                                  type="text"
                                  value={formatNumber(editValues[dia.reporte.id]?.aceites ?? dia.reporte.aceites ?? 0)}
                                  onChange={(e) => handleAceitesChange(dia.reporte!.id, e.target.value)}
                                  className="w-24 px-2 py-1 text-right text-sm border border-[#dbe0e6] dark:border-slate-600 rounded bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1173d4]"
                                />
                              ) : (
                                `$${formatNumber(dia.reporte.aceites)}`
                              )
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#111418] dark:text-white">
                            {dia.reporte ? `$${formatNumber(
                              (dia.reporte.premium?.importe || 0) +
                              (dia.reporte.magna?.importe || 0) +
                              (dia.reporte.diesel?.importe || 0) +
                              (dia.reporte.aceites || 0)
                            )}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {dia.reporte ? (
                              dia.reporte.estado === EstadoReporte.Pendiente ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleGuardarCambios(dia.reporte!.id)}
                                    className="flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                    title="Guardar cambios"
                                  >
                                    <span className="material-symbols-outlined text-xl">save</span>
                                  </button>
                                  <button
                                    onClick={() => handleAprobar(dia.reporte!.id)}
                                    className="flex items-center justify-center w-9 h-9 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
                                    title="Aprobar reporte"
                                  >
                                    <span className="material-symbols-outlined text-xl">check_circle</span>
                                  </button>
                                  <button
                                    onClick={() => handleRechazar(dia.reporte!.id)}
                                    className="flex items-center justify-center w-9 h-9 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
                                    title="Rechazar reporte"
                                  >
                                    <span className="material-symbols-outlined text-xl">cancel</span>
                                  </button>
                                </div>
                              ) : (
                                <span className={`text-sm font-medium ${getEstadoColor(dia.reporte.estado)}`}>
                                  {dia.reporte.estado}
                                </span>
                              )
                            ) : (
                              <button
                                onClick={() => handleCrearReporte(dia.fecha)}
                                className="flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                title="Crear reporte manual"
                              >
                                <span className="material-symbols-outlined text-xl">add_circle</span>
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Tabla expandida (todos los productos en una tabla horizontal) */}
                        {expandedRows[`dia-${dia.dia}`] && dia.reporte && (
                          <tr className="bg-gray-50 dark:bg-[#0d1b2a]">
                            <td colSpan={11} className="px-2 py-4">
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                      <th className="px-2 py-1 text-left">Producto</th>
                                      <th className="px-2 py-1 text-right">LTS</th>
                                      <th className="px-2 py-1 text-right">Merma Vol.</th>
                                      <th className="px-2 py-1 text-right">Precio</th>
                                      <th className="px-2 py-1 text-right">I.I.B.</th>
                                      <th className="px-2 py-1 text-right">C</th>
                                      <th className="px-2 py-1 text-right">C.C.T.</th>
                                      <th className="px-2 py-1 text-right">V.DSC</th>
                                      <th className="px-2 py-1 text-right">DC</th>
                                      <th className="px-2 py-1 text-right">Dif V.DSC</th>
                                      <th className="px-2 py-1 text-right">V</th>
                                      <th className="px-2 py-1 text-right">I.F.</th>
                                      <th className="px-2 py-1 text-right">I.F.F.B.</th>
                                      <th className="px-2 py-1 text-right">ER</th>
                                      <th className="px-2 py-1 text-right">ER%</th>
                                      <th className="px-2 py-1 text-right">E</th>
                                      <th className="px-2 py-1 text-right">E%</th>
                                      <th className="px-2 py-1 text-right">*</th>
                                      <th className="px-2 py-1 text-right">%</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Premium */}
                                    {dia.reporte.premium && dia.reporte.premium.litros_vendidos > 0 && (
                                      <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-2 py-2 font-medium">1</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'iib', dia.reporte.premium.inventario_inicial, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'compras', dia.reporte.premium.compras, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'cct', dia.reporte.premium.cct, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'v_dsc', dia.reporte.premium.v_dsc, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.dc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.dif_v_dsc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(0)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'iffb', dia.reporte.premium.inventario_final, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.eficiencia_real)}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${dia.reporte.premium.eficiencia_real_porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(dia.reporte.premium.eficiencia_real_porcentaje)}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.merma_porcentaje)}%</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.premium.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.premium.merma_porcentaje)}%</td>
                                      </tr>
                                    )}
                                    
                                    {/* Magna */}
                                    {dia.reporte.magna && dia.reporte.magna.litros_vendidos > 0 && (
                                      <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-2 py-2 font-medium">2</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'iib', dia.reporte.magna.inventario_inicial, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'compras', dia.reporte.magna.compras, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'cct', dia.reporte.magna.cct, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'v_dsc', dia.reporte.magna.v_dsc, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.dc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.dif_v_dsc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(0)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'iffb', dia.reporte.magna.inventario_final, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.eficiencia_real)}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${dia.reporte.magna.eficiencia_real_porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(dia.reporte.magna.eficiencia_real_porcentaje)}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.merma_porcentaje)}%</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.magna.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.magna.merma_porcentaje)}%</td>
                                      </tr>
                                    )}
                                    
                                    {/* Diesel */}
                                    {dia.reporte.diesel && dia.reporte.diesel.litros_vendidos > 0 && (
                                      <tr>
                                        <td className="px-2 py-2 font-medium">3</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'iib', dia.reporte.diesel.inventario_inicial, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'compras', dia.reporte.diesel.compras, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'cct', dia.reporte.diesel.cct, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'v_dsc', dia.reporte.diesel.v_dsc, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.dc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.dif_v_dsc)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.litros_vendidos)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(0)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'iffb', dia.reporte.diesel.inventario_final, dia.reporte.estado === EstadoReporte.Pendiente, dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.eficiencia_real)}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${dia.reporte.diesel.eficiencia_real_porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(dia.reporte.diesel.eficiencia_real_porcentaje)}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.merma_porcentaje)}%</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.diesel.merma_volumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(-dia.reporte.diesel.merma_porcentaje)}%</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

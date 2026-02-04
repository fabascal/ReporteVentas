import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { reportesService } from '../services/reportesService'
import { ReporteVentas, EstadoReporte, ProductoCatalogo } from '../types/reportes'
import { Role } from '../types/auth'
import GerenteEstacionHeader from '../components/GerenteEstacionHeader'
import GerenteZonaHeader from '../components/GerenteZonaHeader'
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos'
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
  
  // Detectar el rol del usuario
  const isGerenteZona = user?.role === Role.GerenteZona
  const isGerenteEstacion = user?.role === Role.GerenteEstacion
  
  // Helper para determinar si un campo es editable
  const esEditable = (reporteId: string, estado: string) => {
    return (isGerenteEstacion && estado === EstadoReporte.Pendiente) || 
           (isGerenteZona && reporteEnCorreccion === reporteId)
  }
  
  const [estacionId, setEstacionId] = useState('')
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [año, setAño] = useState(String(new Date().getFullYear()))
  const [hasConsulted, setHasConsulted] = useState(false)
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({})
  const [editValues, setEditValues] = useState<CamposEditables>({})
  const [productosConfig, setProductosConfig] = useState<ProductoCatalogo[]>([])
  const [aceitesInputValue, setAceitesInputValue] = useState<{ [reporteId: string]: string }>({})
  const [fieldInputValues, setFieldInputValues] = useState<{ [key: string]: string }>({})
  const [reporteEnCorreccion, setReporteEnCorreccion] = useState<string | null>(null)

  // Obtener ejercicios activos
  const { aniosDisponibles } = useEjerciciosActivos()

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
    queryKey: ['reportes-mes', estacionId, mes, año, user?.role],
    queryFn: async () => {
      if (!estacionId || !mes || !año) return []
      
      const mesInt = parseInt(mes)
      const añoInt = parseInt(año)
      const primerDia = new Date(añoInt, mesInt - 1, 1)
      const ultimoDia = new Date(añoInt, mesInt, 0)
      
      const fechaInicio = primerDia.toISOString().split('T')[0]
      const fechaFin = ultimoDia.toISOString().split('T')[0]
      
      // Gerente de Zona: solo reportes aprobados
      // Gerente de Estación: solo reportes pendientes (o todos)
      const estadoFiltro = isGerenteZona ? EstadoReporte.Aprobado : undefined
      
      const response = await reportesService.getReportes(
        1, // page
        100, // limit
        estadoFiltro, // estado
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

  // Calcular acumulados mensuales por producto
  const calcularAcumuladosMensuales = () => {
    const acumulados = {
      premium: { er: 0, erImporte: 0, e: 0, eImporte: 0, v: 0 },
      magna: { er: 0, erImporte: 0, e: 0, eImporte: 0, v: 0 },
      diesel: { er: 0, erImporte: 0, e: 0, eImporte: 0, v: 0 },
      aceites: 0
    }

    dias.forEach(dia => {
      if (!dia.reporte) return

      // Premium
      if (dia.reporte.premium) {
        // Calcular ER en tiempo real: ER = IFFB - IF, donde IF = (IIB + CCT) - LTS
        const iib = dia.reporte.premium.iib || 0
        const cct = dia.reporte.premium.cct || 0
        const lts = dia.reporte.premium.litros || 0
        const iffb = dia.reporte.premium.iffb || 0
        const inventarioFinal = (iib + cct) - lts
        const erLitros = iffb - inventarioFinal
        const precio = dia.reporte.premium.precio || 0
        const erImporte = erLitros * precio
        
        acumulados.premium.er += erLitros
        acumulados.premium.erImporte += erImporte
        acumulados.premium.e += dia.reporte.premium.mermaVolumen || 0
        acumulados.premium.eImporte += dia.reporte.premium.mermaImporte || 0
        acumulados.premium.v += lts - (dia.reporte.premium.mermaVolumen || 0)
      }

      // Magna
      if (dia.reporte.magna) {
        // Calcular ER en tiempo real: ER = IFFB - IF, donde IF = (IIB + CCT) - LTS
        const iib = dia.reporte.magna.iib || 0
        const cct = dia.reporte.magna.cct || 0
        const lts = dia.reporte.magna.litros || 0
        const iffb = dia.reporte.magna.iffb || 0
        const inventarioFinal = (iib + cct) - lts
        const erLitros = iffb - inventarioFinal
        const precio = dia.reporte.magna.precio || 0
        const erImporte = erLitros * precio
        
        acumulados.magna.er += erLitros
        acumulados.magna.erImporte += erImporte
        acumulados.magna.e += dia.reporte.magna.mermaVolumen || 0
        acumulados.magna.eImporte += dia.reporte.magna.mermaImporte || 0
        acumulados.magna.v += lts - (dia.reporte.magna.mermaVolumen || 0)
      }

      // Diesel
      if (dia.reporte.diesel) {
        // Calcular ER en tiempo real: ER = IFFB - IF, donde IF = (IIB + CCT) - LTS
        const iib = dia.reporte.diesel.iib || 0
        const cct = dia.reporte.diesel.cct || 0
        const lts = dia.reporte.diesel.litros || 0
        const iffb = dia.reporte.diesel.iffb || 0
        const inventarioFinal = (iib + cct) - lts
        const erLitros = iffb - inventarioFinal
        const precio = dia.reporte.diesel.precio || 0
        const erImporte = erLitros * precio
        
        acumulados.diesel.er += erLitros
        acumulados.diesel.erImporte += erImporte
        acumulados.diesel.e += dia.reporte.diesel.mermaVolumen || 0
        acumulados.diesel.eImporte += dia.reporte.diesel.mermaImporte || 0
        acumulados.diesel.v += lts - (dia.reporte.diesel.mermaVolumen || 0)
      }

      // Sumar aceites
      acumulados.aceites += dia.reporte.aceites || 0
    })

    // Calcular + y %
    const calcularMasYPorcentaje = (producto: 'premium' | 'magna' | 'diesel') => {
      const mas = acumulados[producto].er - acumulados[producto].e
      const porcentaje = acumulados[producto].v !== 0 ? (mas / acumulados[producto].v) * 100 : 0
      return { mas, porcentaje }
    }

    return {
      premium: {
        ...acumulados.premium,
        ...calcularMasYPorcentaje('premium'),
        erPorcentaje: acumulados.premium.v !== 0 ? (acumulados.premium.er / (acumulados.premium.v + acumulados.premium.e)) * 100 : 0,
        ePorcentaje: (acumulados.premium.v + acumulados.premium.e) !== 0 ? (acumulados.premium.e / (acumulados.premium.v + acumulados.premium.e)) * 100 : 0
      },
      magna: {
        ...acumulados.magna,
        ...calcularMasYPorcentaje('magna'),
        erPorcentaje: acumulados.magna.v !== 0 ? (acumulados.magna.er / (acumulados.magna.v + acumulados.magna.e)) * 100 : 0,
        ePorcentaje: (acumulados.magna.v + acumulados.magna.e) !== 0 ? (acumulados.magna.e / (acumulados.magna.v + acumulados.magna.e)) * 100 : 0
      },
      diesel: {
        ...acumulados.diesel,
        ...calcularMasYPorcentaje('diesel'),
        erPorcentaje: acumulados.diesel.v !== 0 ? (acumulados.diesel.er / (acumulados.diesel.v + acumulados.diesel.e)) * 100 : 0,
        ePorcentaje: (acumulados.diesel.v + acumulados.diesel.e) !== 0 ? (acumulados.diesel.e / (acumulados.diesel.v + acumulados.diesel.e)) * 100 : 0
      },
      aceites: acumulados.aceites
    }
  }

  const acumuladosMensuales = calcularAcumuladosMensuales()

  // Mutación para actualizar estado
  const updateEstadoMutation = useMutation({
    mutationFn: async ({ reporteId, nuevoEstado }: { reporteId: string; nuevoEstado: EstadoReporte }) => {
      return await reportesService.updateEstado(reporteId, { estado: nuevoEstado })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      await refetch()
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      await refetch()
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      await refetch()
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
      return reporteActual?.[tipoProducto]?.iib || 0
    } else {
      // Días posteriores: usar I.F.F.B. del día anterior
      const diaAnterior = dias.find(d => d.dia === dia - 1)
      return diaAnterior?.reporte?.[tipoProducto]?.iffb || 0
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
              precio: reporte.premium?.precio || 0,
              litros: reporte.premium?.litros || 0,
              mermaVolumen: reporte.premium?.mermaVolumen || 0,
              iib: getIIB(dia, reporte, dias, 'premium'),
              compras: reporte.premium?.compras || 0,
              cct: reporte.premium?.cct || 0,
              v_dsc: reporte.premium?.vDsc || 0,
              iffb: reporte.premium?.iffb || 0,
            },
            magna: {
              precio: reporte.magna?.precio || 0,
              litros: reporte.magna?.litros || 0,
              mermaVolumen: reporte.magna?.mermaVolumen || 0,
              iib: getIIB(dia, reporte, dias, 'magna'),
              compras: reporte.magna?.compras || 0,
              cct: reporte.magna?.cct || 0,
              v_dsc: reporte.magna?.vDsc || 0,
              iffb: reporte.magna?.iffb || 0,
            },
            diesel: {
              precio: reporte.diesel?.precio || 0,
              litros: reporte.diesel?.litros || 0,
              mermaVolumen: reporte.diesel?.mermaVolumen || 0,
              iib: getIIB(dia, reporte, dias, 'diesel'),
              compras: reporte.diesel?.compras || 0,
              cct: reporte.diesel?.cct || 0,
              v_dsc: reporte.diesel?.vDsc || 0,
              iffb: reporte.diesel?.iffb || 0,
            },
          }
        }
      }))
    }
  }

  const handleFieldChange = (reporteId: string, tipoProducto: string, campo: string, valor: string) => {
    // Permitir solo números y un punto decimal
    const cleanValue = valor.replace(/[^\d.]/g, '')
    const fieldKey = `${reporteId}-${tipoProducto}-${campo}`
    setFieldInputValues(prev => ({
      ...prev,
      [fieldKey]: cleanValue
    }))
  }

  const handleFieldBlur = (reporteId: string, tipoProducto: string, campo: string) => {
    const fieldKey = `${reporteId}-${tipoProducto}-${campo}`
    const valor = fieldInputValues[fieldKey] || '0'
    const numValue = parseFloat(valor) || 0
    
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
    
    // Limpiar el input value para mostrar formato
    setFieldInputValues(prev => {
      const newState = { ...prev }
      delete newState[fieldKey]
      return newState
    })
  }

  const handleAceitesChange = (reporteId: string, valor: string) => {
    // Permitir solo números y un punto decimal
    const cleanValue = valor.replace(/[^\d.]/g, '')
    setAceitesInputValue(prev => ({
      ...prev,
      [reporteId]: cleanValue
    }))
  }

  const handleAceitesBlur = (reporteId: string) => {
    const valor = aceitesInputValue[reporteId] || '0'
    const numValue = parseFloat(valor) || 0
    setEditValues(prev => ({
      ...prev,
      [reporteId]: {
        ...prev[reporteId],
        aceites: numValue,
        productos: prev[reporteId]?.productos || {}
      }
    }))
    // Limpiar el input value para mostrar formato
    setAceitesInputValue(prev => {
      const newState = { ...prev }
      delete newState[reporteId]
      return newState
    })
  }

  const handleGuardarCambios = async (reporteId: string) => {
    const valores = editValues[reporteId]
    if (!valores) return

    // Buscar el reporte original para obtener todos los campos necesarios
    const reporteOriginal = reportes?.find(r => r.id === reporteId)
    if (!reporteOriginal) {
      toast.error('No se encontró el reporte')
      return
    }

    try {
      // Si es Gerente de Zona, aplicar corrección en cascada
      if (isGerenteZona && reporteEnCorreccion) {
        await aplicarCorreccionEnCascada(reporteId, valores, reporteOriginal)
      } else {
        // Gerente de Estación: guardar normalmente
        await updateReporteMutation.mutateAsync({
          reporteId,
          data: {
            estacionId: reporteOriginal.estacionId,
            fecha: reporteOriginal.fecha,
            aceites: valores.aceites ?? reporteOriginal.aceites,
            premium: {
              precio: valores.productos.premium?.precio ?? reporteOriginal.premium?.precio ?? 0,
              litros: valores.productos.premium?.litros ?? reporteOriginal.premium?.litros ?? 0,
              mermaVolumen: valores.productos.premium?.mermaVolumen ?? reporteOriginal.premium?.mermaVolumen ?? 0,
              iib: valores.productos.premium?.iib ?? reporteOriginal.premium?.iib,
              compras: valores.productos.premium?.compras ?? reporteOriginal.premium?.compras,
              cct: valores.productos.premium?.cct ?? reporteOriginal.premium?.cct,
              vDsc: valores.productos.premium?.v_dsc ?? reporteOriginal.premium?.vDsc,
              iffb: valores.productos.premium?.iffb ?? reporteOriginal.premium?.iffb,
            },
            magna: {
              precio: valores.productos.magna?.precio ?? reporteOriginal.magna?.precio ?? 0,
              litros: valores.productos.magna?.litros ?? reporteOriginal.magna?.litros ?? 0,
              mermaVolumen: valores.productos.magna?.mermaVolumen ?? reporteOriginal.magna?.mermaVolumen ?? 0,
              iib: valores.productos.magna?.iib ?? reporteOriginal.magna?.iib,
              compras: valores.productos.magna?.compras ?? reporteOriginal.magna?.compras,
              cct: valores.productos.magna?.cct ?? reporteOriginal.magna?.cct,
              vDsc: valores.productos.magna?.v_dsc ?? reporteOriginal.magna?.vDsc,
              iffb: valores.productos.magna?.iffb ?? reporteOriginal.magna?.iffb,
            },
            diesel: {
              precio: valores.productos.diesel?.precio ?? reporteOriginal.diesel?.precio ?? 0,
              litros: valores.productos.diesel?.litros ?? reporteOriginal.diesel?.litros ?? 0,
              mermaVolumen: valores.productos.diesel?.mermaVolumen ?? reporteOriginal.diesel?.mermaVolumen ?? 0,
              iib: valores.productos.diesel?.iib ?? reporteOriginal.diesel?.iib,
              compras: valores.productos.diesel?.compras ?? reporteOriginal.diesel?.compras,
              cct: valores.productos.diesel?.cct ?? reporteOriginal.diesel?.cct,
              vDsc: valores.productos.diesel?.v_dsc ?? reporteOriginal.diesel?.vDsc,
              iffb: valores.productos.diesel?.iffb ?? reporteOriginal.diesel?.iffb,
            }
          }
        })
      }
      
      // Invalidar cache y forzar recarga para reflejar los cambios
      await queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      
      // Limpiar el estado de la fila editada para que tome datos frescos
      setEditValues(prev => {
        const updated = { ...prev }
        delete updated[reporteId]
        return updated
      })
      
      await refetch()
      
      toast.success('Cambios guardados correctamente')
      
      // Si es Gerente de Zona y está corrigiendo, salir del modo de corrección
      if (isGerenteZona && reporteEnCorreccion) {
        setReporteEnCorreccion(null)
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      toast.error('Error al guardar cambios')
    }
  }

  const aplicarCorreccionEnCascada = async (reporteIdInicial: string, valoresIniciales: any, reporteOriginal: ReporteVentas) => {
    const toastId = toast.loading('Aplicando corrección en cascada...')
    
    console.log('[CASCADA] Iniciando corrección en cascada para reporte:', reporteIdInicial)
    console.log('[CASCADA] Valores iniciales:', valoresIniciales)
    
    try {
      // Encontrar el día que se está corrigiendo
      const dias = generarDiasDelMes()
      const diaCorregido = dias.find(d => d.reporte?.id === reporteIdInicial)
      if (!diaCorregido || !diaCorregido.reporte) {
        throw new Error('No se encontró el reporte a corregir')
      }
      
      console.log('[CASCADA] Día corregido:', diaCorregido.dia, 'Reporte:', diaCorregido.reporte.id)

      // Actualizar el día corregido primero
      await updateReporteMutation.mutateAsync({
        reporteId: reporteIdInicial,
        data: {
          estacionId: reporteOriginal.estacionId,
          fecha: reporteOriginal.fecha,
          aceites: valoresIniciales.aceites ?? reporteOriginal.aceites,
          premium: {
            precio: valoresIniciales.productos.premium?.precio ?? reporteOriginal.premium?.precio ?? 0,
            litros: valoresIniciales.productos.premium?.litros ?? reporteOriginal.premium?.litros ?? 0,
            mermaVolumen: valoresIniciales.productos.premium?.mermaVolumen ?? reporteOriginal.premium?.mermaVolumen ?? 0,
            iib: valoresIniciales.productos.premium?.iib ?? reporteOriginal.premium?.iib,
            compras: valoresIniciales.productos.premium?.compras ?? reporteOriginal.premium?.compras,
            cct: valoresIniciales.productos.premium?.cct ?? reporteOriginal.premium?.cct,
            vDsc: valoresIniciales.productos.premium?.v_dsc ?? reporteOriginal.premium?.vDsc,
            iffb: valoresIniciales.productos.premium?.iffb ?? reporteOriginal.premium?.iffb,
          },
          magna: {
            precio: valoresIniciales.productos.magna?.precio ?? reporteOriginal.magna?.precio ?? 0,
            litros: valoresIniciales.productos.magna?.litros ?? reporteOriginal.magna?.litros ?? 0,
            mermaVolumen: valoresIniciales.productos.magna?.mermaVolumen ?? reporteOriginal.magna?.mermaVolumen ?? 0,
            iib: valoresIniciales.productos.magna?.iib ?? reporteOriginal.magna?.iib,
            compras: valoresIniciales.productos.magna?.compras ?? reporteOriginal.magna?.compras,
            cct: valoresIniciales.productos.magna?.cct ?? reporteOriginal.magna?.cct,
            vDsc: valoresIniciales.productos.magna?.v_dsc ?? reporteOriginal.magna?.vDsc,
            iffb: valoresIniciales.productos.magna?.iffb ?? reporteOriginal.magna?.iffb,
          },
          diesel: {
            precio: valoresIniciales.productos.diesel?.precio ?? reporteOriginal.diesel?.precio ?? 0,
            litros: valoresIniciales.productos.diesel?.litros ?? reporteOriginal.diesel?.litros ?? 0,
            mermaVolumen: valoresIniciales.productos.diesel?.mermaVolumen ?? reporteOriginal.diesel?.mermaVolumen ?? 0,
            iib: valoresIniciales.productos.diesel?.iib ?? reporteOriginal.diesel?.iib,
            compras: valoresIniciales.productos.diesel?.compras ?? reporteOriginal.diesel?.compras,
            cct: valoresIniciales.productos.diesel?.cct ?? reporteOriginal.diesel?.cct,
            vDsc: valoresIniciales.productos.diesel?.v_dsc ?? reporteOriginal.diesel?.vDsc,
            iffb: valoresIniciales.productos.diesel?.iffb ?? reporteOriginal.diesel?.iffb,
          }
        }
      })

      // Calcular el IFFB del día corregido para todos los productos
      const calcularIFFBCorregido = (producto: string) => {
        const valoresProd = valoresIniciales.productos[producto]
        const reporteProd = diaCorregido.reporte![producto]
        
        // Usar valores editados o valores originales del reporte
        const iib = valoresProd?.iib ?? reporteProd?.iib ?? 0
        const compras = valoresProd?.compras ?? reporteProd?.compras ?? 0
        const cct = valoresProd?.cct ?? reporteProd?.cct ?? 0
        const vDsc = valoresProd?.v_dsc ?? reporteProd?.vDsc ?? 0
        const iffb = valoresProd?.iffb ?? reporteProd?.iffb ?? 0
        const litros = reporteProd?.litros ?? 0
        
        // Si IFFB fue editado manualmente, usarlo
        if (valoresProd?.iffb !== undefined) {
          return iffb
        }
        
        // Calcular IF = (IIB + CCT) - LTS
        const inventarioFinal = (iib + cct) - litros
        
        // Si no hay IFFB editado, retornar el calculado
        // (en realidad el IFFB debería ser editado manualmente, pero por si acaso)
        return iffb || inventarioFinal
      }

      const iffbPremiumCorregido = calcularIFFBCorregido('premium')
      const iffbMagnaCorregido = calcularIFFBCorregido('magna')
      const iffbDieselCorregido = calcularIFFBCorregido('diesel')

      console.log('[CASCADA] IFFB corregidos - Premium:', iffbPremiumCorregido, 'Magna:', iffbMagnaCorregido, 'Diesel:', iffbDieselCorregido)

      // Encontrar todos los días posteriores
      const diasPosteriores = dias.filter(d => d.dia > diaCorregido.dia && d.reporte)
      
      console.log('[CASCADA] Días posteriores a actualizar:', diasPosteriores.length)
      diasPosteriores.forEach(d => console.log(`  - Día ${d.dia}:`, d.reporte?.id))
      
      // Actualizar cada día posterior en cascada
      let iibPremiumAnterior = iffbPremiumCorregido
      let iibMagnaAnterior = iffbMagnaCorregido
      let iibDieselAnterior = iffbDieselCorregido

      for (const diaPosterior of diasPosteriores) {
        if (!diaPosterior.reporte) continue

        console.log(`[CASCADA] Actualizando día ${diaPosterior.dia}`)
        console.log(`[CASCADA]   IIB que se aplicará - Premium: ${iibPremiumAnterior}, Magna: ${iibMagnaAnterior}, Diesel: ${iibDieselAnterior}`)
        console.log(`[CASCADA]   IFFB actual del día - Premium: ${diaPosterior.reporte.premium?.iffb}, Magna: ${diaPosterior.reporte.magna?.iffb}, Diesel: ${diaPosterior.reporte.diesel?.iffb}`)

        // El IIB de este día es el IFFB del día anterior
        await updateReporteMutation.mutateAsync({
          reporteId: diaPosterior.reporte.id,
          data: {
            estacionId: diaPosterior.reporte.estacionId,
            fecha: diaPosterior.reporte.fecha,
            aceites: diaPosterior.reporte.aceites,
            premium: {
              precio: diaPosterior.reporte.premium?.precio ?? 0,
              litros: diaPosterior.reporte.premium?.litros ?? 0,
              mermaVolumen: diaPosterior.reporte.premium?.mermaVolumen ?? 0,
              iib: iibPremiumAnterior,
              compras: diaPosterior.reporte.premium?.compras,
              cct: diaPosterior.reporte.premium?.cct,
              vDsc: diaPosterior.reporte.premium?.vDsc,
              iffb: diaPosterior.reporte.premium?.iffb,
            },
            magna: {
              precio: diaPosterior.reporte.magna?.precio ?? 0,
              litros: diaPosterior.reporte.magna?.litros ?? 0,
              mermaVolumen: diaPosterior.reporte.magna?.mermaVolumen ?? 0,
              iib: iibMagnaAnterior,
              compras: diaPosterior.reporte.magna?.compras,
              cct: diaPosterior.reporte.magna?.cct,
              vDsc: diaPosterior.reporte.magna?.vDsc,
              iffb: diaPosterior.reporte.magna?.iffb,
            },
            diesel: {
              precio: diaPosterior.reporte.diesel?.precio ?? 0,
              litros: diaPosterior.reporte.diesel?.litros ?? 0,
              mermaVolumen: diaPosterior.reporte.diesel?.mermaVolumen ?? 0,
              iib: iibDieselAnterior,
              compras: diaPosterior.reporte.diesel?.compras,
              cct: diaPosterior.reporte.diesel?.cct,
              vDsc: diaPosterior.reporte.diesel?.vDsc,
              iffb: diaPosterior.reporte.diesel?.iffb,
            }
          }
        })

        // El IFFB de este día (sin cambios) se convierte en el IIB del siguiente
        // Usamos el IFFB original del reporte porque no lo modificamos
        iibPremiumAnterior = diaPosterior.reporte.premium?.iffb ?? 0
        iibMagnaAnterior = diaPosterior.reporte.magna?.iffb ?? 0
        iibDieselAnterior = diaPosterior.reporte.diesel?.iffb ?? 0
      }

      // Invalidar cache y forzar recarga inmediata
      console.log('[CASCADA] Invalidando caché y recargando datos...')
      await queryClient.invalidateQueries({ queryKey: ['reportes-mes'] })
      
      // Cerrar todas las filas expandidas para forzar que tomen datos frescos
      setExpandedRows({})
      
      // Limpiar valores editados
      setEditValues({})
      
      await refetch()
      
      console.log('[CASCADA] Datos recargados exitosamente')
      console.log('[CASCADA] Corrección completada exitosamente')
      toast.success(`Corrección aplicada en cascada a ${diasPosteriores.length} días posteriores`, { id: toastId })
    } catch (error) {
      console.error('Error en corrección en cascada:', error)
      toast.error('Error al aplicar corrección en cascada', { id: toastId })
      throw error
    }
  }

  const handleIniciarCorreccion = (reporteId: string) => {
    setReporteEnCorreccion(reporteId)
    toast('Modo de corrección activado. Modifica los campos necesarios y guarda.', {
      icon: 'ℹ️',
      duration: 4000
    })
  }

  const handleCancelarCorreccion = () => {
    if (reporteEnCorreccion) {
      // Limpiar valores editados
      setEditValues(prev => {
        const newState = { ...prev }
        delete newState[reporteEnCorreccion]
        return newState
      })
      setAceitesInputValue({})
      setFieldInputValues({})
    }
    setReporteEnCorreccion(null)
    toast('Corrección cancelada', {
      icon: 'ℹ️'
    })
  }

  // Verificar si todos los días anteriores están aprobados
  const puedeAprobarDia = (diaActual: number): { puede: boolean; mensaje: string } => {
    for (let i = 1; i < diaActual; i++) {
      const diaAnterior = dias.find(d => d.dia === i)
      if (diaAnterior?.reporte && diaAnterior.reporte.estado !== EstadoReporte.Aprobado) {
        return {
          puede: false,
          mensaje: `Debes aprobar primero el día ${i}`
        }
      }
    }
    return { puede: true, mensaje: 'Aprobar reporte' }
  }

  const handleAprobar = (reporteId: string) => {
    // Ambos roles aprueban directamente
    updateEstadoMutation.mutate({ reporteId, nuevoEstado: EstadoReporte.Aprobado })
  }

  const handleRechazar = (reporteId: string) => {
    updateEstadoMutation.mutate({ reporteId, nuevoEstado: EstadoReporte.Rechazado })
  }

  const handleCrearReporte = async (fecha: string) => {
    if (!estacionId) return
    
    toast.loading('Creando reporte...')
    
    createReporteMutation.mutate({
      estacionId: estacionId,
      fecha: fecha,
      aceites: 0,
      premium: {
        precio: 0,
        litros: 0,
        importe: 0,
        mermaVolumen: 0,
        mermaImporte: 0,
        mermaPorcentaje: 0,
        iib: 0,
        compras: 0,
        cct: 0,
        vDsc: 0,
        iffb: 0
      },
      magna: {
        precio: 0,
        litros: 0,
        importe: 0,
        mermaVolumen: 0,
        mermaImporte: 0,
        mermaPorcentaje: 0,
        iib: 0,
        compras: 0,
        cct: 0,
        vDsc: 0,
        iffb: 0
      },
      diesel: {
        precio: 0,
        litros: 0,
        importe: 0,
        mermaVolumen: 0,
        mermaImporte: 0,
        mermaPorcentaje: 0,
        iib: 0,
        compras: 0,
        cct: 0,
        vDsc: 0,
        iffb: 0
      }
    })
  }

  // Función para obtener valor calculado o editado
  const getValor = (reporteId: string, tipoProducto: string, campo: string, valorOriginal: number | undefined): number => {
    return editValues[reporteId]?.productos?.[tipoProducto]?.[campo] ?? valorOriginal ?? 0
  }

  // Calcular DC = C - CCT
  const calcularDC = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const compras = getValor(reporteId, tipoProducto, 'compras', reporte.compras)
    const cct = getValor(reporteId, tipoProducto, 'cct', reporte.cct)
    return compras - cct
  }

  // Calcular Dif V.DSC = (CCT + V.DSC) - C
  const calcularDifVDsc = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const cct = getValor(reporteId, tipoProducto, 'cct', reporte.cct)
    const vDsc = getValor(reporteId, tipoProducto, 'v_dsc', reporte.vDsc)
    const compras = getValor(reporteId, tipoProducto, 'compras', reporte.compras)
    return (cct + vDsc) - compras
  }

  // Calcular V = LTS - Merma Vol.
  const calcularV = (reporte: any): number => {
    return (reporte.litros || 0) - (reporte.mermaVolumen || 0)
  }

  // Calcular IF (Inventario Final) = (IIB + CCT) - LTS
  const calcularIF = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const iib = getValor(reporteId, tipoProducto, 'iib', reporte.iib)
    const cct = getValor(reporteId, tipoProducto, 'cct', reporte.cct)
    const lts = reporte.litros || 0
    return (iib + cct) - lts
  }

  // Calcular ER (Eficiencia Real) = IFFB - IF
  const calcularER = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const iffb = getValor(reporteId, tipoProducto, 'iffb', reporte.iffb)
    const inventarioFinal = calcularIF(reporteId, tipoProducto, reporte)
    return iffb - inventarioFinal
  }

  // Calcular ER% = ER / (V + Merma Vol)
  const calcularERPorcentaje = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const er = calcularER(reporteId, tipoProducto, reporte)
    const v = calcularV(reporte)
    const mermaVol = reporte.mermaVolumen || 0
    const denominador = v + mermaVol
    return denominador !== 0 ? (er / denominador) * 100 : 0
  }

  // Calcular + (antes *) = ER - E (E = Merma)
  const calcularMas = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const er = calcularER(reporteId, tipoProducto, reporte)
    const e = reporte.mermaVolumen || 0
    return er - e
  }

  // Calcular % = + / V
  const calcularMasPorcentaje = (reporteId: string, tipoProducto: string, reporte: any): number => {
    const mas = calcularMas(reporteId, tipoProducto, reporte)
    const v = calcularV(reporte)
    return v !== 0 ? (mas / v) * 100 : 0
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
    const fieldKey = `${reporteId}-${tipoProducto}-${campo}`

    if (esEditable) {
      // Si estamos editando este campo
      if (fieldInputValues[fieldKey] !== undefined) {
        return (
          <input
            type="text"
            value={fieldInputValues[fieldKey]}
            onChange={(e) => handleFieldChange(reporteId, tipoProducto, campo, e.target.value)}
            onBlur={() => handleFieldBlur(reporteId, tipoProducto, campo)}
            onFocus={(e) => e.target.select()}
            className="w-20 px-1 py-0.5 text-right text-xs border border-[#dbe0e6] dark:border-slate-600 rounded bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1173d4]"
          />
        )
      }
      
      // Mostrar valor formateado, clickeable para editar
      return (
        <div
          onClick={() => {
            setFieldInputValues(prev => ({
              ...prev,
              [fieldKey]: valor.toString()
            }))
          }}
          className="cursor-pointer px-1 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-right"
          title="Haz clic para editar"
        >
          {formatNumber(valor)}
        </div>
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
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
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

        {/* Acumulados mensuales */}
        {hasConsulted && dias.length > 0 && (
          <div className="sticky top-16 z-10 bg-white dark:bg-[#1a2632] border-b border-[#e6e8eb] dark:border-slate-700 mb-4 shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg text-[#111418] dark:text-white">summarize</span>
                <h3 className="text-sm font-bold text-[#111418] dark:text-white">Acumulado del Mes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                      <th className="text-left py-1 px-2 font-semibold text-[#111418] dark:text-white">Producto</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">ER</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">ER%</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">E</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">E%</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">+</th>
                      <th className="text-right py-1 px-2 font-semibold text-[#111418] dark:text-white">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                      <td className="py-1 px-2 text-[#111418] dark:text-white">1 - Premium</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.er)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.erPorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.e)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.ePorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.mas)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.premium.porcentaje)}%</td>
                    </tr>
                    <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                      <td className="py-1 px-2 text-[#111418] dark:text-white">2 - Magna</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.er)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.erPorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.e)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.ePorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.mas)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.magna.porcentaje)}%</td>
                    </tr>
                    <tr className="border-b border-[#e6e8eb] dark:border-slate-700">
                      <td className="py-1 px-2 text-[#111418] dark:text-white">3 - Diesel</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.er)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.erPorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.e)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.ePorcentaje)}%</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.mas)}</td>
                      <td className="text-right py-1 px-2 text-[#111418] dark:text-white">{formatNumber(acumuladosMensuales.diesel.porcentaje)}%</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-[#111418] dark:text-white">Aceites</td>
                      <td colSpan={6} className="text-right py-1 px-2 font-bold text-[#111418] dark:text-white">${formatNumber(acumuladosMensuales.aceites)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
                      1 E
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      E%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      2 E
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      E%
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      3 E
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                      E%
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
                            {dia.reporte?.premium ? formatNumber(dia.reporte.premium.mermaVolumen || 0) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.premium ? formatNumber(dia.reporte.premium.mermaPorcentaje || 0) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.magna ? formatNumber(dia.reporte.magna.mermaVolumen || 0) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.magna ? formatNumber(dia.reporte.magna.mermaPorcentaje || 0) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.diesel ? formatNumber(dia.reporte.diesel.mermaVolumen || 0) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte?.diesel ? formatNumber(dia.reporte.diesel.mermaPorcentaje || 0) + '%' : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-[#111418] dark:text-white">
                            {dia.reporte ? (
                              // Editable si: Gerente Estación con reporte pendiente O Gerente Zona en modo corrección
                              esEditable(dia.reporte.id, dia.reporte.estado) ? (
                                aceitesInputValue[dia.reporte.id] !== undefined ? (
                                  <input
                                    type="text"
                                    value={aceitesInputValue[dia.reporte.id]}
                                    onChange={(e) => handleAceitesChange(dia.reporte!.id, e.target.value)}
                                    onBlur={() => handleAceitesBlur(dia.reporte!.id)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-24 px-2 py-1 text-right text-sm border border-[#dbe0e6] dark:border-slate-600 rounded bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#1173d4]"
                                  />
                                ) : (
                                  <div
                                    onClick={() => {
                                      setAceitesInputValue(prev => ({
                                        ...prev,
                                        [dia.reporte!.id]: (editValues[dia.reporte!.id]?.aceites ?? dia.reporte!.aceites ?? 0).toString()
                                      }))
                                    }}
                                    className="cursor-pointer px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Haz clic para editar"
                                  >
                                    ${formatNumber(editValues[dia.reporte.id]?.aceites ?? dia.reporte.aceites ?? 0)}
                                  </div>
                                )
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
                              // Gerente de Estación: aprobar/rechazar reportes pendientes
                              isGerenteEstacion && dia.reporte.estado === EstadoReporte.Pendiente ? (
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
                                    disabled={!puedeAprobarDia(dia.dia).puede}
                                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all shadow-sm ${
                                      puedeAprobarDia(dia.dia).puede
                                        ? 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                    }`}
                                    title={puedeAprobarDia(dia.dia).mensaje}
                                  >
                                    <span className="material-symbols-outlined text-xl">
                                      {puedeAprobarDia(dia.dia).puede ? 'check_circle' : 'lock'}
                                    </span>
                                  </button>
                                  <button
                                    onClick={() => handleRechazar(dia.reporte!.id)}
                                    className="flex items-center justify-center w-9 h-9 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
                                    title="Rechazar reporte"
                                  >
                                    <span className="material-symbols-outlined text-xl">cancel</span>
                                  </button>
                                </div>
                              ) : 
                              // Gerente de Zona: corregir reportes aprobados
                              isGerenteZona && dia.reporte.estado === EstadoReporte.Aprobado ? (
                                reporteEnCorreccion === dia.reporte.id ? (
                                  // Botones de guardar/cancelar cuando está en modo corrección
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleGuardarCambios(dia.reporte!.id)}
                                      className="flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                      title="Guardar corrección"
                                    >
                                      <span className="material-symbols-outlined text-xl">save</span>
                                    </button>
                                    <button
                                      onClick={handleCancelarCorreccion}
                                      className="flex items-center justify-center w-9 h-9 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm hover:shadow-md"
                                      title="Cancelar corrección"
                                    >
                                      <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                  </div>
                                ) : (
                                  // Botón de corregir
                                  <button
                                    onClick={() => handleIniciarCorreccion(dia.reporte!.id)}
                                    className="flex items-center justify-center w-9 h-9 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm hover:shadow-md"
                                    title="Corregir reporte"
                                  >
                                    <span className="material-symbols-outlined text-xl">edit</span>
                                  </button>
                                )
                              ) : (
                                // Mostrar el estado del reporte
                                <span className={`text-sm font-medium ${getEstadoColor(dia.reporte.estado)}`}>
                                  {dia.reporte.estado}
                                </span>
                              )
                            ) : (
                              // Botón para crear reporte manual (solo Gerente de Estación)
                              isGerenteEstacion ? (
                                <button
                                  onClick={() => handleCrearReporte(dia.fecha)}
                                  className="flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                  title="Crear reporte manual"
                                >
                                  <span className="material-symbols-outlined text-xl">add_circle</span>
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )
                            )}
                          </td>
                        </tr>

                        {/* Tabla expandida (todos los productos en una tabla horizontal) */}
                        {expandedRows[`dia-${dia.dia}`] && dia.reporte && (
                          <tr className="bg-gray-50 dark:bg-[#0d1b2a]">
                            <td colSpan={12} className="px-2 py-4">
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                      <th className="px-2 py-1 text-left">Producto</th>
                                      <th className="px-2 py-1 text-right">LTS</th>
                                      <th className="px-2 py-1 text-right">Merma Vol.</th>
                                      <th className="px-2 py-1 text-right">Precio</th>
                                      <th className="px-2 py-1 text-right">Merma $</th>
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
                                      <th className="px-2 py-1 text-right">+</th>
                                      <th className="px-2 py-1 text-right">%</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Premium */}
                                    {dia.reporte.premium && (
                                      <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-2 py-2 font-medium">1</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'litros', dia.reporte.premium.litros, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'mermaVolumen', dia.reporte.premium.mermaVolumen, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'precio', dia.reporte.premium.precio, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.mermaVolumen * dia.reporte.premium.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'iib', dia.reporte.premium.iib, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'compras', dia.reporte.premium.compras, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'cct', dia.reporte.premium.cct, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'v_dsc', dia.reporte.premium.vDsc, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDC(dia.reporte.id, 'premium', dia.reporte.premium))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDifVDsc(dia.reporte.id, 'premium', dia.reporte.premium))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularV(dia.reporte.premium))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularIF(dia.reporte.id, 'premium', dia.reporte.premium))}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'premium', 'iffb', dia.reporte.premium.iffb, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularER(dia.reporte.id, 'premium', dia.reporte.premium))}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${calcularERPorcentaje(dia.reporte.id, 'premium', dia.reporte.premium) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(calcularERPorcentaje(dia.reporte.id, 'premium', dia.reporte.premium))}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.mermaVolumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.premium.mermaPorcentaje)}%</td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMas(dia.reporte.id, 'premium', dia.reporte.premium) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMas(dia.reporte.id, 'premium', dia.reporte.premium))}
                                        </td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMasPorcentaje(dia.reporte.id, 'premium', dia.reporte.premium) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMasPorcentaje(dia.reporte.id, 'premium', dia.reporte.premium))}%
                                        </td>
                                      </tr>
                                    )}
                                    
                                    {/* Magna */}
                                    {dia.reporte.magna && (
                                      <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-2 py-2 font-medium">2</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'litros', dia.reporte.magna.litros, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'mermaVolumen', dia.reporte.magna.mermaVolumen, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'precio', dia.reporte.magna.precio, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.mermaVolumen * dia.reporte.magna.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'iib', dia.reporte.magna.iib, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'compras', dia.reporte.magna.compras, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'cct', dia.reporte.magna.cct, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'v_dsc', dia.reporte.magna.vDsc, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDC(dia.reporte.id, 'magna', dia.reporte.magna))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDifVDsc(dia.reporte.id, 'magna', dia.reporte.magna))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularV(dia.reporte.magna))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularIF(dia.reporte.id, 'magna', dia.reporte.magna))}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'magna', 'iffb', dia.reporte.magna.iffb, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularER(dia.reporte.id, 'magna', dia.reporte.magna))}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${calcularERPorcentaje(dia.reporte.id, 'magna', dia.reporte.magna) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(calcularERPorcentaje(dia.reporte.id, 'magna', dia.reporte.magna))}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.mermaVolumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.magna.mermaPorcentaje)}%</td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMas(dia.reporte.id, 'magna', dia.reporte.magna) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMas(dia.reporte.id, 'magna', dia.reporte.magna))}
                                        </td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMasPorcentaje(dia.reporte.id, 'magna', dia.reporte.magna) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMasPorcentaje(dia.reporte.id, 'magna', dia.reporte.magna))}%
                                        </td>
                                      </tr>
                                    )}
                                    
                                    {/* Diesel */}
                                    {dia.reporte.diesel && (
                                      <tr>
                                        <td className="px-2 py-2 font-medium">3</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'litros', dia.reporte.diesel.litros, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'mermaVolumen', dia.reporte.diesel.mermaVolumen, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'precio', dia.reporte.diesel.precio, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.mermaVolumen * dia.reporte.diesel.precio)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'iib', dia.reporte.diesel.iib, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'compras', dia.reporte.diesel.compras, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'cct', dia.reporte.diesel.cct, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'v_dsc', dia.reporte.diesel.vDsc, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDC(dia.reporte.id, 'diesel', dia.reporte.diesel))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularDifVDsc(dia.reporte.id, 'diesel', dia.reporte.diesel))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularV(dia.reporte.diesel))}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularIF(dia.reporte.id, 'diesel', dia.reporte.diesel))}</td>
                                        <td className="px-2 py-2 text-right">{renderField(dia.reporte.id, 'diesel', 'iffb', dia.reporte.diesel.iffb, esEditable(dia.reporte.id, dia.reporte.estado), dia.dia)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(calcularER(dia.reporte.id, 'diesel', dia.reporte.diesel))}</td>
                                        <td className={`px-2 py-2 text-right font-medium ${calcularERPorcentaje(dia.reporte.id, 'diesel', dia.reporte.diesel) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatNumber(calcularERPorcentaje(dia.reporte.id, 'diesel', dia.reporte.diesel))}%
                                        </td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.mermaVolumen)}</td>
                                        <td className="px-2 py-2 text-right">{formatNumber(dia.reporte.diesel.mermaPorcentaje)}%</td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMas(dia.reporte.id, 'diesel', dia.reporte.diesel) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMas(dia.reporte.id, 'diesel', dia.reporte.diesel))}
                                        </td>
                                        <td className={`px-2 py-2 text-right font-semibold ${calcularMasPorcentaje(dia.reporte.id, 'diesel', dia.reporte.diesel) < 0 ? 'text-red-600' : ''}`}>
                                          {formatNumber(calcularMasPorcentaje(dia.reporte.id, 'diesel', dia.reporte.diesel))}%
                                        </td>
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

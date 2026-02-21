import axios from 'axios'
import { ReporteVentas, EstadoReporte } from '../types/reportes'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface CreateReporteDto {
  estacionId: string
  fecha: string
  aceites?: number // Campo único a nivel de reporte (en pesos)
  premium: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
  magna: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
  diesel: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
}

export interface UpdateEstadoDto {
  estado: EstadoReporte
  comentarios?: string
}

export interface UpdateReporteDto {
  estacionId: string
  fecha: string
  aceites?: number // Campo único a nivel de reporte (en pesos)
  premium: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
  magna: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
  diesel: { 
    precio: number; 
    litros: number; 
    importe?: number; 
    mermaVolumen?: number; 
    mermaImporte?: number; 
    mermaPorcentaje?: number;
    eficienciaReal?: number;
    eficienciaImporte?: number;
    eficienciaRealPorcentaje?: number;
    iib?: number;
    compras?: number;
    cct?: number;
    vDsc?: number;
    dc?: number;
    difVDsc?: number;
    if?: number;
    iffb?: number;
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats?: {
    pendientes: number
    enRevision: number
    aprobados: number
    rechazados: number
  }
}

export interface ReporteERZonaResponse {
  periodo: {
    mes: number
    anio: number
  }
  zona: {
    id: string
    nombre: string
  }
  productos: Array<{
    id: string
    tipo_producto: string
    nombre_display: string
  }>
  filas: Array<{
    estacion_id: string
    estacion_nombre: string
    valores: Record<string, number>
  }>
}

export interface ReporteRGeneralResponse {
  periodo: {
    mes: number
    anio: number
  }
  producto: 'premium' | 'magna' | 'diesel' | string
  zonas: Array<{
    zona_id: string
    zona_nombre: string
    zona_orden?: number
    estaciones: Array<{
      estacion_id: string
      estacion_nombre: string
      iib: number
      c: number
      lts: number
      it: number
      iffb: number
      ee: number
      d: number
      er: number
      vc: number
      er_porcentaje: number
      ee_porcentaje: number
    }>
  }>
}

export interface ReporteConciliacionMensualResponse {
  periodo: {
    mes: number
    anio: number
  }
  productos: Array<{
    id: string
    tipo_producto: string
    nombre_display: string
  }>
  total_zonas: number
  zonas: Array<{
    zona_id: string
    zona_nombre: string
    zona_orden?: number
    total_merma_zona: number
    total_entregas_zona: number
    diferencia_zona: number
    total_estaciones: number
    estaciones: Array<{
      estacion_id: string
      identificador_externo?: string
      nombre: string
      productos: Record<string, { merma_volumen: number; precio: number; merma_monto: number }>
      total_merma: number
      total_entregas: number
      diferencia: number
    }>
  }>
}

export interface ReporteLiquidacionesResponse {
  periodo: { mes: number; anio: number }
  resumen: {
    total_zonas: number
    total_merma: number
    total_entregas: number
    total_gastos: number
    total_saldo_inicial: number
    total_saldo_final: number
    total_diferencia: number
  }
  zonas: Array<{
    zona_id: string
    zona_nombre: string
    zona_orden?: number
    liquidacion_id: string
    merma_generada: number
    entregas_realizadas: number
    gastos_realizados: number
    saldo_inicial: number
    saldo_final: number
    diferencia: number
    fecha_cierre?: string
    observaciones?: string | null
    total_estaciones: number
    estaciones: Array<{
      estacion_id: string
      estacion_nombre: string
      identificador_externo?: string
      merma_generada: number
      entregas_realizadas: number
      gastos_realizados: number
      saldo_inicial: number
      saldo_final: number
      diferencia: number
      fecha_cierre?: string
    }>
  }>
}

export const reportesService = {
  async getReportes(
    page: number = 1, 
    limit: number = 20, 
    estado?: string, 
    busqueda?: string,
    estacionId?: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<PaginatedResponse<ReporteVentas>> {
    const params: any = { page, limit }
    if (estado) {
      params.estado = estado
    }
    if (busqueda) {
      params.busqueda = busqueda
    }
    if (estacionId) {
      params.estacionId = estacionId
    }
    if (fechaDesde) {
      params.fechaDesde = fechaDesde
    }
    if (fechaHasta) {
      params.fechaHasta = fechaHasta
    }
    const response = await api.get<PaginatedResponse<ReporteVentas>>('/reportes', { params })
    return response.data
  },

  async getReporteById(id: string): Promise<ReporteVentas> {
    const response = await api.get<ReporteVentas>(`/reportes/${id}`)
    return response.data
  },

  async createReporte(data: CreateReporteDto): Promise<ReporteVentas> {
    const response = await api.post<ReporteVentas>('/reportes', data)
    return response.data
  },

  async updateEstado(id: string, data: UpdateEstadoDto): Promise<ReporteVentas> {
    const response = await api.patch<ReporteVentas>(`/reportes/${id}/estado`, data)
    return response.data
  },

  async updateReporte(id: string, data: UpdateReporteDto): Promise<ReporteVentas> {
    const response = await api.put<ReporteVentas>(`/reportes/${id}`, data)
    return response.data
  },

  async getEstaciones(): Promise<Array<{ id: string; nombre: string; zonaNombre: string }>> {
    const response = await api.get('/estaciones')
    return response.data
  },

  async getProductosCatalogo(): Promise<Array<{ id: string; nombre: string; nombre_display: string; activo: boolean }>> {
    const response = await api.get('/productos')
    return response.data
  },

  async actualizarReportesConValoresAleatorios(): Promise<{ message: string; actualizados: number; total: number; errores?: string[] }> {
    const response = await api.post('/reportes/actualizar-valores-aleatorios')
    return response.data
  },

  async obtenerDatosAPI(estacionId: string, fecha: string): Promise<{
    aceites?: number
    premium?: {
      precio: number
      litros: number
      importe: number
      adminVolumen: number
      adminImporte: number
      mermaVolumen: number
      mermaImporte: number
      mermaPorcentaje: number
      iib: number
      compras: number
      iffb: number
    }
    magna?: {
      precio: number
      litros: number
      importe: number
      adminVolumen: number
      adminImporte: number
      mermaVolumen: number
      mermaImporte: number
      mermaPorcentaje: number
      iib: number
      compras: number
      iffb: number
    }
    diesel?: {
      precio: number
      litros: number
      importe: number
      adminVolumen: number
      adminImporte: number
      mermaVolumen: number
      mermaImporte: number
      mermaPorcentaje: number
      iib: number
      compras: number
      iffb: number
    }
  }> {
    const response = await api.post('/reportes/obtener-datos-api', { estacionId, fecha })
    return response.data
  },

  async getAuditoriaReporte(id: string): Promise<Array<{
    id: string
    reporteId: string
    usuarioId: string
    usuarioNombre: string
    accion: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'CAMBIO_ESTADO'
    campoModificado?: string
    valorAnterior?: string
    valorNuevo?: string
    descripcion?: string
    fechaCambio: string
  }>> {
    const response = await api.get(`/reportes/${id}/auditoria`)
    return response.data
  },

  async getAllLogs(
    page: number = 1,
    limit: number = 20,
    filters?: {
      accion?: string
      usuario?: string
      fechaDesde?: string
      fechaHasta?: string
      busqueda?: string
    }
  ): Promise<PaginatedResponse<{
    id: string
    reporteId: string
    usuarioId: string
    usuarioNombre: string
    accion: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'CAMBIO_ESTADO'
    campoModificado?: string
    valorAnterior?: string
    valorNuevo?: string
    descripcion?: string
    fechaCambio: string
    fechaReporte?: string
    estacionId?: string
    estacionNombre?: string
  }>> {
    const params: any = { page, limit }
    if (filters) {
      if (filters.accion) params.accion = filters.accion
      if (filters.usuario) params.usuario = filters.usuario
      if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde
      if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta
      if (filters.busqueda) params.busqueda = filters.busqueda
    }
    const response = await api.get<PaginatedResponse<any>>('/reportes/logs/todos', { params })
    return response.data
  },

  // Obtener logs del sistema (gastos, entregas, cierres)
  async getLogsSistema(
    page: number = 1,
    limit: number = 20,
    filtros?: {
      entidadTipo?: string
      usuarioId?: string
      accion?: string
      fechaDesde?: string
      fechaHasta?: string
      busqueda?: string
    }
  ): Promise<PaginatedResponse<any>> {
    const params: any = { page, limit }
    if (filtros) {
      if (filtros.entidadTipo) params.entidadTipo = filtros.entidadTipo
      if (filtros.usuarioId) params.usuarioId = filtros.usuarioId
      if (filtros.accion) params.accion = filtros.accion
      if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
      if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
      if (filtros.busqueda) params.busqueda = filtros.busqueda
    }
    const response = await api.get<PaginatedResponse<any>>('/reportes/logs/sistema', { params })
    return response.data
  },

  // Obtener cadena de reportes afectados
  obtenerCadenaAfectada: async (id: string) => {
    try {
      const response = await api.get<ReporteAfectado[]>(`/reportes/cadena-afectada/${id}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener cadena afectada:', error)
      throw error
    }
  },

  // Corregir reporte y aplicar cascada
  corregirReporte: async (id: string, datos: any) => {
    try {
      const response = await api.post(`/reportes/corregir/${id}`, datos)
      return response.data
    } catch (error) {
      console.error('Error al corregir reporte:', error)
      throw error
    }
  },

  // Obtener reporte detallado de ventas
  getReporteVtas: async (estacionId: string, mes: string, año: string, producto: 'premium' | 'magna' | 'diesel') => {
    try {
      const response = await api.get('/reportes/vtas', {
        params: { estacionId, mes, año, producto },
      })
      return response.data
    } catch (error) {
      console.error('Error al obtener reporte de ventas:', error)
      throw error
    }
  },

  // Obtener reporte ER por zona
  getReporteERPorZona: async (
    mes: string,
    anio: string,
    zonaId: string
  ): Promise<ReporteERZonaResponse> => {
    const response = await api.get<ReporteERZonaResponse>('/reportes/er/zona', {
      params: { mes, anio, zonaId },
    })
    return response.data
  },

  getReporteRGeneral: async (
    mes: string,
    anio: string,
    producto: 'premium' | 'magna' | 'diesel'
  ): Promise<ReporteRGeneralResponse> => {
    const response = await api.get<ReporteRGeneralResponse>('/reportes/r/general', {
      params: { mes, anio, producto },
    })
    return response.data
  },

  getReporteConciliacionMensual: async (
    mes: string,
    anio: string
  ): Promise<ReporteConciliacionMensualResponse> => {
    const response = await api.get<ReporteConciliacionMensualResponse>('/reportes/conciliacion-mensual', {
      params: { mes, anio },
    })
    return response.data
  },

  getReporteLiquidaciones: async (
    mes: string,
    anio: string
  ): Promise<ReporteLiquidacionesResponse> => {
    const response = await api.get<ReporteLiquidacionesResponse>('/reportes/liquidaciones', {
      params: { mes, anio },
    })
    return response.data
  },

  // Exportar reporte de ventas a Excel
  exportReporteVtasExcel: async (estacionId: string, mes: string, anio: string) => {
    try {
      const response = await api.get('/reportes/vtas/excel', {
        params: { estacionId, mes, anio },
        responseType: 'blob',
      })
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte-vtas-${mes}-${anio}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      throw error
    }
  },

  // Exportar reporte de ventas a PDF
  exportReporteVtasPDF: async (estacionId: string, mes: string, anio: string) => {
    try {
      const response = await api.get('/reportes/vtas/pdf', {
        params: { estacionId, mes, anio },
        responseType: 'blob',
      })
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte-vtas-${mes}-${anio}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      throw error
    }
  }
}

export interface ReporteAfectado {
  id: string
  fecha: string
  estacionNombre: string
  estado: string
}

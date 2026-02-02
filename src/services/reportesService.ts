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
    premium?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    magna?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    diesel?: { precio: number; litros: number; importe: number; mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
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

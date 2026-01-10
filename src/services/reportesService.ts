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
}

export const reportesService = {
  async getReportes(page: number = 1, limit: number = 20, estado?: string): Promise<PaginatedResponse<ReporteVentas>> {
    const params: any = { page, limit }
    if (estado) {
      params.estado = estado
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
}


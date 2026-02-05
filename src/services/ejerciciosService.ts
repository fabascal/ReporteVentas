import axios from 'axios'

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

export interface PeriodoDisponible {
  anio: number
  mes: number
}

export interface EjercicioFiscal {
  id: string
  anio: number
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  estado: 'activo' | 'inactivo' | 'cerrado'
  descripcion?: string
  created_at: string
  updated_at: string
}

export interface PeriodoMensual {
  anio: number
  mes: number
  zonas: ZonaDetalle[]
}

export interface ZonaDetalle {
  zona_id: string
  zona_nombre: string
  operativo_cerrado: boolean
  operativo_fecha_cierre?: string
  contable_cerrado: boolean
  contable_fecha_cierre?: string
  contable_observaciones?: string
}

const ejerciciosService = {
  async getPeriodosDisponibles(): Promise<PeriodoDisponible[]> {
    try {
      const response = await api.get<{ success: boolean; data: PeriodoDisponible[] }>(
        '/ejercicios/periodos-disponibles'
      )
      return response.data.data || []
    } catch (error) {
      console.error('Error al obtener periodos disponibles:', error)
      return []
    }
  },

  async getActivos() {
    try {
      const response = await api.get('/ejercicios/activos')
      return response.data
    } catch (error) {
      console.error('Error al obtener ejercicios activos:', error)
      return { success: false, data: [] }
    }
  },

  async getAll(): Promise<EjercicioFiscal[]> {
    try {
      const response = await api.get<{ success: boolean; data: EjercicioFiscal[] }>('/ejercicios')
      return response.data.data || []
    } catch (error) {
      console.error('Error al obtener ejercicios:', error)
      return []
    }
  },

  async getPeriodos(anio: number): Promise<PeriodoMensual[]> {
    try {
      const response = await api.get<{ success: boolean; data: PeriodoMensual[] }>(`/ejercicios/${anio}/periodos`)
      return response.data.data || []
    } catch (error) {
      console.error('Error al obtener periodos:', error)
      return []
    }
  },

  async create(data: { anio: number; nombre: string; descripcion?: string }) {
    const response = await api.post('/ejercicios', data)
    return response.data
  },

  async updateEstado(id: string, estado: 'activo' | 'inactivo' | 'cerrado') {
    const response = await api.patch(`/ejercicios/${id}/estado`, { estado })
    return response.data
  },

  async cerrarPeriodoOperativo(zona_id: string, anio: number, mes: number) {
    const response = await api.post('/ejercicios/periodos/operativo/cerrar', { zona_id, anio, mes })
    return response.data
  },

  async reabrirPeriodoOperativo(zona_id: string, anio: number, mes: number) {
    const response = await api.post('/ejercicios/periodos/operativo/reabrir', { zona_id, anio, mes })
    return response.data
  },

  async cerrarPeriodoContable(zona_id: string, anio: number, mes: number, observaciones?: string) {
    const response = await api.post('/ejercicios/periodos/contable/cerrar', { zona_id, anio, mes, observaciones })
    return response.data
  },

  async reabrirPeriodoContable(zona_id: string, anio: number, mes: number) {
    const response = await api.post('/ejercicios/periodos/contable/reabrir', { zona_id, anio, mes })
    return response.data
  },

  async verificarEstadoPeriodoOperativo(zona_id: string, anio: number, mes: number) {
    try {
      const response = await api.get('/ejercicios/periodos/operativo/estado', {
        params: { zona_id, anio, mes }
      })
      return response.data
    } catch (error) {
      console.error('Error al verificar estado periodo operativo:', error)
      return { success: false, data: null }
    }
  },

  async verificarEstadoPeriodoContable(zona_id: string, anio: number, mes: number) {
    try {
      const response = await api.get('/ejercicios/periodos/contable/estado', {
        params: { zona_id, anio, mes }
      })
      return response.data
    } catch (error) {
      console.error('Error al verificar estado periodo contable:', error)
      return { success: false, data: null }
    }
  },
}

export default ejerciciosService

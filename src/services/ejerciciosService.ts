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

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

export interface ConfiguracionAPI {
  apiUsuario: string
  apiContrasena: string
}

export const configuracionService = {
  async getConfiguracionAPI(): Promise<ConfiguracionAPI> {
    const response = await api.get<ConfiguracionAPI>('/configuracion/api')
    return response.data
  },

  async updateConfiguracionAPI(data: ConfiguracionAPI): Promise<void> {
    await api.put('/configuracion/api', data)
  },

  async sincronizarReportes(fechaInicio: string, fechaFin: string): Promise<{
    message: string
    resultado: { creados: number; actualizados: number; errores: number }
  }> {
    const response = await api.post('/reportes/sincronizar', {
      fechaInicio,
      fechaFin,
    })
    return response.data
  },

  async probarConexion(usuario: string, contrasena: string): Promise<{
    success: boolean
    message: string
    token?: string
  }> {
    const response = await api.post('/reportes/probar-conexion', {
      usuario,
      contrasena,
    })
    return response.data
  },

  async sincronizarEstaciones(fechaInicio: string, fechaFin: string, zonaId?: string): Promise<{
    message: string
    resultado: {
      creadas: number
      actualizadas: number
      errores: number
      estaciones: Array<{ identificadorExterno: string; nombre: string }>
    }
  }> {
    const response = await api.post('/reportes/sincronizar-estaciones', {
      fechaInicio,
      fechaFin,
      zonaId,
    })
    return response.data
  },
}


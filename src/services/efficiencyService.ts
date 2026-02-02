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

export const efficiencyService = {
  async getEfficiencyData(estacionId: string, mes: number, anio: number) {
    const response = await api.get(`/reportes/eficiencia`, {
      params: { estacion_id: estacionId, mes, anio }
    })
    return response.data
  },

  getExcelUrl(estacionId: string, mes: number, anio: number) {
    const token = localStorage.getItem('token')
    return `${API_URL}/reportes/eficiencia/excel?estacion_id=${estacionId}&mes=${mes}&anio=${anio}&token=${token}`
  },

  getPdfUrl(estacionId: string, mes: number, anio: number) {
    const token = localStorage.getItem('token')
    return `${API_URL}/reportes/eficiencia/pdf?estacion_id=${estacionId}&mes=${mes}&anio=${anio}&token=${token}`
  }
}

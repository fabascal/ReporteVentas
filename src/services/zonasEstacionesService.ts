import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Zona {
  id: string
  nombre: string
  activa: boolean
  created_at: string
  total_estaciones?: number
  estaciones_activas?: number
  estaciones?: Estacion[]
}

export interface Estacion {
  id: string
  nombre: string
  zonaId: string
  zonaNombre?: string
  activa: boolean
  identificadorExterno?: string
  tienePremium?: boolean
  tieneMagna?: boolean
  tieneDiesel?: boolean
  created_at?: string
}

export interface CreateZonaData {
  nombre: string
}

export interface UpdateZonaData {
  nombre: string
  activa?: boolean
}

export interface CreateEstacionData {
  nombre: string
  zonaId: string
  identificadorExterno?: string
  tienePremium?: boolean
  tieneMagna?: boolean
  tieneDiesel?: boolean
}

export interface UpdateEstacionData {
  nombre?: string
  zonaId?: string
  activa?: boolean
  identificadorExterno?: string
  tienePremium?: boolean
  tieneMagna?: boolean
  tieneDiesel?: boolean
}

export const zonasEstacionesService = {
  // Zonas
  async getZonas(): Promise<Zona[]> {
    const response = await api.get<Zona[]>('/zonas')
    return response.data
  },

  async getZonaById(id: string): Promise<Zona> {
    const response = await api.get<Zona>(`/zonas/${id}`)
    return response.data
  },

  async createZona(data: CreateZonaData): Promise<Zona> {
    const response = await api.post<Zona>('/zonas', data)
    return response.data
  },

  async updateZona(id: string, data: UpdateZonaData): Promise<Zona> {
    const response = await api.put<Zona>(`/zonas/${id}`, data)
    return response.data
  },

  async deleteZona(id: string): Promise<void> {
    await api.delete(`/zonas/${id}`)
  },

  // Estaciones
  async getEstaciones(): Promise<Estacion[]> {
    const response = await api.get<Estacion[]>('/estaciones')
    return response.data
  },

  async getEstacionById(id: string): Promise<Estacion> {
    const response = await api.get<Estacion>(`/estaciones/${id}`)
    return response.data
  },

  async createEstacion(data: CreateEstacionData): Promise<Estacion> {
    const response = await api.post<Estacion>('/estaciones', {
      nombre: data.nombre,
      zona_id: data.zonaId,
      identificador_externo: data.identificadorExterno,
      tiene_premium: data.tienePremium,
      tiene_magna: data.tieneMagna,
      tiene_diesel: data.tieneDiesel,
    })
    return response.data
  },

  async updateEstacion(id: string, data: UpdateEstacionData): Promise<Estacion> {
    const payload: any = { nombre: data.nombre }
    if (data.zonaId !== undefined) payload.zona_id = data.zonaId
    if (data.activa !== undefined) payload.activa = data.activa
    if (data.identificadorExterno !== undefined) payload.identificador_externo = data.identificadorExterno
    if (data.tienePremium !== undefined) payload.tiene_premium = data.tienePremium
    if (data.tieneMagna !== undefined) payload.tiene_magna = data.tieneMagna
    if (data.tieneDiesel !== undefined) payload.tiene_diesel = data.tieneDiesel
    const response = await api.put<Estacion>(`/estaciones/${id}`, payload)
    return response.data
  },

  async deleteEstacion(id: string): Promise<void> {
    await api.delete(`/estaciones/${id}`)
  },
}


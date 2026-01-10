import axios from 'axios'
import { User, Role } from '../types/auth'

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

export interface UsuarioCompleto extends User {
  createdAt: string
  updatedAt: string
  estaciones: Array<{ id: string; nombre: string }>
  zonas: Array<{ id: string; nombre: string }>
}

export interface CreateUsuarioData {
  email: string
  password?: string
  name: string
  role: Role
  estaciones?: string[]
  zonas?: string[]
}

export interface UpdateUsuarioData {
  email?: string
  password?: string
  name?: string
  role?: Role
}

export interface Zona {
  id: string
  nombre: string
}

export interface Estacion {
  id: string
  nombre: string
  zonaId: string
  zonaNombre: string
}

export const usuariosService = {
  async getUsuarios(): Promise<UsuarioCompleto[]> {
    const response = await api.get<UsuarioCompleto[]>('/usuarios')
    return response.data
  },

  async getUsuarioById(id: string): Promise<UsuarioCompleto> {
    const response = await api.get<UsuarioCompleto>(`/usuarios/${id}`)
    return response.data
  },

  async createUsuario(data: CreateUsuarioData): Promise<UsuarioCompleto> {
    const response = await api.post<UsuarioCompleto>('/usuarios', data)
    return response.data
  },

  async updateUsuario(id: string, data: UpdateUsuarioData): Promise<UsuarioCompleto> {
    const response = await api.put<UsuarioCompleto>(`/usuarios/${id}`, data)
    return response.data
  },

  async deleteUsuario(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`)
  },

  async asignarEstaciones(id: string, estaciones: string[]): Promise<void> {
    await api.put(`/usuarios/${id}/estaciones`, { estaciones })
  },

  async asignarZonas(id: string, zonas: string[]): Promise<void> {
    await api.put(`/usuarios/${id}/zonas`, { zonas })
  },

  async getZonas(): Promise<Zona[]> {
    const response = await api.get<Zona[]>('/usuarios/zonas')
    return response.data
  },
}


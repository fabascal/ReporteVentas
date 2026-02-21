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

export interface Role {
  id: string
  codigo: string
  nombre: string
  descripcion?: string
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface CreateRoleData {
  codigo: string
  nombre: string
  descripcion?: string
  activo?: boolean
  orden?: number
}

export interface UpdateRoleData {
  codigo?: string
  nombre?: string
  descripcion?: string
  activo?: boolean
  orden?: number
}

export const rolesService = {
  async getRoles(): Promise<Role[]> {
    const response = await api.get<Role[]>('/roles')
    return response.data
  },

  async getRoleById(id: string): Promise<Role> {
    const response = await api.get<Role>(`/roles/${id}`)
    return response.data
  },

  async getRoleByCodigo(codigo: string): Promise<Role> {
    const response = await api.get<Role>(`/roles/codigo/${codigo}`)
    return response.data
  },

  async createRole(data: CreateRoleData): Promise<Role> {
    const response = await api.post<Role>('/roles', data)
    return response.data
  },

  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const response = await api.put<Role>(`/roles/${id}`, data)
    return response.data
  },

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`)
  },
}

